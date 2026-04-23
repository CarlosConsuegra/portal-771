import { maps as mockMaps } from "@/data/maps";
import { MapRecord, MapRow } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const MAP_COLUMNS = "id, slug, titulo, image_url, created_at";

function mapRowToMap(row: MapRow): MapRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.titulo,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

export async function listMaps() {
  if (!isSupabaseConfigured()) {
    return mockMaps;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maps")
    .select(MAP_COLUMNS)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Error leyendo mapas: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRowToMap(row as MapRow));
}

export async function getMapById(id: string) {
  if (!isSupabaseConfigured()) {
    return mockMaps.find((map) => map.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maps")
    .select(MAP_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Error leyendo mapa: ${error.message}`);
  }

  return data ? mapRowToMap(data as MapRow) : null;
}
