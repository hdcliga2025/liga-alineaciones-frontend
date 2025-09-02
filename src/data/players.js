// src/data/players.js
//
// Manifesto local de xogadores (simple e fácil de manter).
// Edita só o array FILES cando haxa altas/baixas.
// Nome de ficheiro: "<dorsal>-<Nome Apelidos>-<POS>.jpg" (POS ∈ {POR,DEF,CEN,DEL})

const FILES = [
  "1-Iván Villar-POR.jpg",
  "2-Carl Starfelt-DEF.jpg",
  "3-Óscar Mingueza-DEF.jpg",
  "4-Joseph Aidoo-DEF.jpg",
  "5-Sergio Carreira-DEF.jpg",
  "6-Ilaix Moriba-CEN.jpg",
  "7-Borja Iglesias-DEL.jpg",
  "8-Fran Beltrán-CEN.jpg",
  "9-Ferran Jutglà-DEL.jpg",
  "10-Iago Aspas-DEL.jpg",
  "11-Franco Cervi-DEL.jpg",
  "12-Manu Fernández-CEN.jpg",
  "13-Andrei Radu-POR.jpg",
  "14-Damián Rodríguez-CEN.jpg",
  "15-Bryan Zaragoza-DEL.jpg",
  "16-Miguel Román-CEN.jpg",
  "17-Javi Rueda-DEF.jpg",
  "18-Pablo Durán-DEL.jpg",
  "19-Williot Swedberg-DEL.jpg",
  "20-Marcos Alonso-DEF.jpg",
  "21-Mihailo Ristic-DEF.jpg",
  "22-Hugo Sotelo-CEN.jpg",
  "23-Hugo Álvarez-DEL.jpg",
  "24-Carlos Domínguez-DEL.jpg",
  "25-Marc Vidal-POR.jpg",
  "31-Yoel Lago-DEF.jpg",
  "32-Javi Rodríguez-DEF.jpg",
  "39-Jones El-Abdellaoui-DEL.jpg",
];

const POS_LABEL = {
  POR: "Porteiro",
  DEF: "Defensa",
  CEN: "Medio",
  DEL: "Dianteiro",
};

function parseFromFile(file) {
  // "NN-Nome Apelidos-POS.ext"
  const m = file.match(/^(\d+)-(.+)-([A-Z]{3})\.[^.]+$/);
  if (!m) {
    return {
      dorsal: null,
      name: file.replace(/\.[^.]+$/, ""),
      pos: "CEN",
      posLabel: POS_LABEL["CEN"],
      file,
    };
  }
  const dorsal = Number(m[1]);
  const name = m[2].trim();
  const pos = (m[3] || "CEN").toUpperCase();
  return { dorsal, name, pos, posLabel: POS_LABEL[pos] || pos, file };
}

/**
 * Constrúe a lista de xogadores coas URLs completas
 * @param {string} baseUrl  VITE_FOTOS_BASE_URL
 */
export function buildPlayers(baseUrl = "") {
  const base = (baseUrl || "").replace(/\/+$/, "");
  return FILES.map((file) => {
    const meta = parseFromFile(file);
    const url = `${base}/${encodeURIComponent(file)}`;
    return { ...meta, url };
  }).sort((a, b) => (a.dorsal ?? 999) - (b.dorsal ?? 999));
}

// Export de conveniencia (útil se non queres pasar a base en cada sitio)
const BASE = (import.meta.env && import.meta.env.VITE_FOTOS_BASE_URL) || "";
export const PLAYERS = buildPlayers(BASE);
