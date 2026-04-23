import { Portal, PortalRow } from "@/lib/types";
import { portals as mockPortals } from "@/data/portals";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const PORTAL_COLUMNS = "*";

function mapRowToPortal(row: PortalRow): Portal {
  return {
    id: row.id,
    slug: row.slug,
    portalId: row.slug,
    title: row.titulo,
    narrative: row.narrativa,
    imageUrl: row.image_url,
    imageUrl360: row.image_360_url ?? null,
    mapId: row.mapa_id,
    lat: row.lat,
    lng: row.lng,
    markerX: Number(row.marker_x),
    markerY: Number(row.marker_y),
    audioUrl: row.audio_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listPublishedPortals() {
  if (!isSupabaseConfigured()) {
    return mockPortals.filter((portal) => portal.status === "published");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portales")
    .select(PORTAL_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error leyendo portales públicos: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRowToPortal(row as PortalRow));
}

export async function getPublishedPortalBySlug(slug: string) {
  if (!isSupabaseConfigured()) {
    return mockPortals.find((portal) => portal.slug === slug || portal.id === slug);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portales")
    .select(PORTAL_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Error leyendo portal público: ${error.message}`);
  }

  return data ? mapRowToPortal(data as PortalRow) : null;
}

export async function listAdminPortals() {
  if (!isSupabaseConfigured()) {
    return mockPortals;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portales")
    .select(PORTAL_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error leyendo archivo admin: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRowToPortal(row as PortalRow));
}

export async function getAdminPortalById(id: string) {
  if (!isSupabaseConfigured()) {
    return mockPortals.find((portal) => portal.id === id) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portales")
    .select(PORTAL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Error leyendo portal admin: ${error.message}`);
  }

  return data ? mapRowToPortal(data as PortalRow) : null;
}
