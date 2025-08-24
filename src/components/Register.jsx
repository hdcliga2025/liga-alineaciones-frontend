// src/components/Register.jsx
import { useState } from "preact/hooks";
import { route } from "preact-router";
import { supabase } from "../lib/supabaseClient";

function mapAuthError(err) {
  if (!err) return "";
  const m = (err.message || "").toLowerCase();
  if (m.includes("user already registered")) return "Este correo xa está rexistrado.";
  if (m.includes("password")) return "Revisa os requisitos do contrasinal.";
  return err.message;
}

function splitFullName(full) {
  const safe = (full || "").trim().replace(/\s+/g, " ");
  if (!safe) return { nombre: "", apellidos: "" };
  const parts = safe.split(" ");
  if (parts.length === 1) return { nombre: parts[0], apellidos: "" };
  return { nombre: parts[0], apellidos: parts.slice(1).join(" ") };
}

export default function Register({ onSuccess }) {
  const [form, setForm] = useState({
    nomeCompleto: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.currentTarget.name]: e.currentTarget.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    if (form.password.length < 8) {
      setError("O contrasinal debe ter como mínimo 8 caracteres.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Os contrasinais non coinciden.");
      return;
    }

    const { nombre, apellidos } = splitFullName(form.nomeCompleto);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nombre, apellidos, full_name: form.nomeCompleto },
        emailRedire
