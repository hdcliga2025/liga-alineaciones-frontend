// tools/upsert-admins.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey);

const admins = [
  { email: 'HDCLiga@gmail.com',  password: 'HDC2025@'   },
  { email: 'HDCLiga2@gmail.com', password: 'HDC2025@2' },
];

async function upsertAuthUser({ email, password }) {
  // Lista usuarios y busca por email (case-insensitive)
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;

  const found = (listData?.users || []).find(
    u => (u.email || '').toLowerCase() === email.toLowerCase()
  );

  if (found) {
    // Actualiza contraseña y confirma email
    const { error: updErr } = await admin.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
    });
    if (updErr) throw updErr;
    return found;
  }

  // Crea usuario ya confirmado
  const { data: createData, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  return createData.user;
}

async function ensureProfileAdmin(user) {
  const emailLower = String(user.email).toLowerCase();

  // 1) Upsert por EMAIL → si existe ese email, actualiza su fila al nuevo id/role
  let { error } = await admin
    .from('profiles')
    .upsert(
      { id: user.id, email: emailLower, role: 'admin' },
      { onConflict: 'email' }
    );
  if (!error) return;

  // 2) Si aún choca (23505), reconciliar: borrar filas con ese email que no sean el id correcto y reintentar
  if (String(error.code) === '23505') {
    const { error: delErr } = await admin
      .from('profiles')
      .delete()
      .neq('id', user.id)
      .eq('email', emailLower);
    if (delErr) throw delErr;

    const { error: up2Err } = await admin
      .from('profiles')
      .upsert(
        { id: user.id, email: emailLower, role: 'admin' },
        { onConflict: 'email' }
      );
    if (up2Err) throw up2Err;
    return;
  }

  // 3) Otros errores
  throw error;
}

async function main() {
  for (const a of admins) {
    const user = await upsertAuthUser(a);
    await ensureProfileAdmin(user);
    console.log(`OK admin: ${a.email}`);
  }
  console.log('Listo.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
