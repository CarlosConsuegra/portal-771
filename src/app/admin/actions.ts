"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  supabaseStorageBucket,
} from "@/lib/supabase/config";
import { extractYouTubeVideoId } from "@/lib/youtube";

function parseRequiredString(value: FormDataEntryValue | null, label: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Falta ${label}.`);
  }

  return value.trim();
}

function parseOptionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function hasFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0;
}

async function maybeUploadFile(
  file: FormDataEntryValue | null,
  slug: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  folder: "images"
) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const fallbackExtension = "jpg";
  const extension = (file.name.split(".").pop() ?? fallbackExtension).toLowerCase();

  const path = `${slug}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(supabaseStorageBucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    throw new Error(`No se pudo subir el archivo: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(path);

  return publicUrl;
}

function buildPortalPayload(
  formData: FormData,
  titulo: string,
  imageUrl: string,
  image360Url: string | null,
  audioUrl: string | null,
  youtubeVideoId: string | null
) {
  return {
    slug: parseRequiredString(formData.get("slug"), "slug"),
    titulo,
    narrativa: parseRequiredString(formData.get("narrative"), "narrativa"),
    mapa_id: parseRequiredString(formData.get("mapId"), "mapa_id"),
    marker_x: parseRequiredString(formData.get("markerX"), "marker_x"),
    marker_y: parseRequiredString(formData.get("markerY"), "marker_y"),
    image_url: imageUrl,
    image_360_url: image360Url,
    media_type: parseRequiredString(formData.get("mediaType"), "media_type"),
    youtube_video_id: youtubeVideoId,
    audio_url: audioUrl,
    status: parseRequiredString(formData.get("status"), "status"),
  };
}

function validatePublishedPortal(
  formData: FormData,
  titulo: string,
  imageUrl: string,
  image360Url: string | null,
  youtubeVideoId: string | null
) {
  const status = parseOptionalString(formData.get("status")).toLowerCase();
  const mediaType = parseOptionalString(formData.get("mediaType")) || "image_2d";

  if (status !== "published") {
    return;
  }

  const slug = parseOptionalString(formData.get("slug"));
  const narrative = parseOptionalString(formData.get("narrative"));
  const mapId = parseOptionalString(formData.get("mapId"));
  const markerX = parseOptionalString(formData.get("markerX"));
  const markerY = parseOptionalString(formData.get("markerY"));

  if (!slug) {
    throw new Error("Falta slug");
  }

  if (!titulo) {
    throw new Error("Falta titulo");
  }

  if (!narrative) {
    throw new Error("Falta narrativa");
  }

  if (!mapId) {
    throw new Error("Falta mapa_id");
  }

  if (
    markerX === "" ||
    markerY === "" ||
    !Number.isFinite(Number(markerX)) ||
    !Number.isFinite(Number(markerY))
  ) {
    throw new Error("Faltan coordenadas del marcador");
  }

  if (
    mediaType === "image_2d" &&
    !imageUrl &&
    !hasFile(formData.get("imageFile"))
  ) {
    throw new Error("Falta imagen");
  }

  if (mediaType === "image_360" && !image360Url) {
    throw new Error("Falta imagen 360");
  }

  if (mediaType === "youtube_360" && !youtubeVideoId) {
    throw new Error("Falta video de YouTube 360");
  }
}

export async function login(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/admin/login?error=config");
  }

  const supabase = await createClient();
  const email = parseRequiredString(formData.get("email"), "email");
  const password = parseRequiredString(formData.get("password"), "password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/admin/login?error=auth");
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/admin/login");
}

export async function createPortal(formData: FormData) {
  const tituloRaw = formData.get("titulo");
  const titulo = typeof tituloRaw === "string" ? tituloRaw.trim() : "";

  if (!titulo || titulo.length === 0) {
    throw new Error("Falta titulo");
  }

  const supabase = await requireAdminSession();
  const slug = parseRequiredString(formData.get("slug"), "slug");
  const currentImageUrl = parseOptionalString(formData.get("imageUrl"));
  const currentAudioUrl =
    parseOptionalString(formData.get("audio_url")) ||
    parseOptionalString(formData.get("audioUrl"));
  const currentImage360Url = parseOptionalString(formData.get("image_360_url"));
  const youtubeVideoId = extractYouTubeVideoId(
    parseOptionalString(formData.get("youtubeVideoInput"))
  );

  validatePublishedPortal(
    formData,
    titulo,
    currentImageUrl,
    currentImage360Url || null,
    youtubeVideoId
  );

  const uploadedImageUrl = await maybeUploadFile(
    formData.get("imageFile"),
    slug,
    supabase,
    "images"
  );
  const audioUrl = currentAudioUrl || null;
  const image360Url = currentImage360Url || null;
  const payload = buildPortalPayload(
    formData,
    titulo,
    uploadedImageUrl ?? currentImageUrl,
    image360Url,
    audioUrl,
    youtubeVideoId
  );

  const { data, error } = await supabase
    .from("portales")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(`No se pudo crear el portal: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin/portal/${data.id}`);
}

export async function updatePortal(id: string, formData: FormData) {
  const tituloRaw = formData.get("titulo");
  const titulo = typeof tituloRaw === "string" ? tituloRaw.trim() : "";

  if (!titulo || titulo.length === 0) {
    throw new Error("Falta titulo");
  }

  const supabase = await requireAdminSession();
  const slug = parseRequiredString(formData.get("slug"), "slug");
  const currentImageUrl = parseOptionalString(formData.get("imageUrl"));
  const currentAudioUrl =
    parseOptionalString(formData.get("audio_url")) ||
    parseOptionalString(formData.get("audioUrl"));
  const currentImage360Url = parseOptionalString(formData.get("image_360_url"));
  const youtubeVideoId = extractYouTubeVideoId(
    parseOptionalString(formData.get("youtubeVideoInput"))
  );

  validatePublishedPortal(
    formData,
    titulo,
    currentImageUrl,
    currentImage360Url || null,
    youtubeVideoId
  );

  const uploadedImageUrl = await maybeUploadFile(
    formData.get("imageFile"),
    slug,
    supabase,
    "images"
  );
  const { data: existingPortal, error: existingPortalError } = await supabase
    .from("portales")
    .select("audio_url")
    .eq("id", id)
    .maybeSingle();

  if (existingPortalError) {
    throw new Error(
      `No se pudo leer el audio actual del portal: ${existingPortalError.message}`
    );
  }

  const audioUrl = currentAudioUrl || existingPortal?.audio_url || null;
  const image360Url = currentImage360Url || null;
  const payload = buildPortalPayload(
    formData,
    titulo,
    uploadedImageUrl ?? currentImageUrl,
    image360Url,
    audioUrl,
    youtubeVideoId
  );

  const { error } = await supabase.from("portales").update(payload).eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar el portal: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/portal/${payload.slug}`);
  redirect(`/admin/portal/${id}`);
}

export async function deletePortal(id: string) {
  const supabase = await requireAdminSession();

  const { error } = await supabase.from("portales").delete().eq("id", id);

  if (error) {
    throw new Error(`No se pudo eliminar el portal: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createMap(formData: FormData) {
  const supabase = await requireAdminSession();

  const payload = {
    slug: parseRequiredString(formData.get("slug"), "slug"),
    titulo: parseRequiredString(formData.get("titulo"), "titulo"),
    image_url: parseRequiredString(formData.get("imageUrl"), "image_url"),
  };

  const { data, error } = await supabase
    .from("maps")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(`No se pudo crear el mapa: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/mapas");
  revalidatePath("/admin/new");
  redirect(`/admin/mapas/${data.id}`);
}

export async function updateMap(id: string, formData: FormData) {
  const supabase = await requireAdminSession();

  const payload = {
    slug: parseRequiredString(formData.get("slug"), "slug"),
    titulo: parseRequiredString(formData.get("titulo"), "titulo"),
    image_url: parseRequiredString(formData.get("imageUrl"), "image_url"),
  };

  const { error } = await supabase.from("maps").update(payload).eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar el mapa: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/mapas");
  revalidatePath("/admin/new");
  revalidatePath(`/admin/mapas/${id}`);
  redirect(`/admin/mapas/${id}`);
}
