import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigurado
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function guardarConsumo(consumo) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { data, error } = await supabase.from("consumos").insert(consumo).select();
  if (error) throw error;
  return data;
}

export async function guardarMeta(meta) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { data, error } = await supabase.from("metas").insert(meta).select();
  if (error) throw error;
  return data;
}
