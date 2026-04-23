"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  supabaseStorageBucket,
} from "@/lib/supabase/config";

function parseRequiredString(value: FormDataEntryValue | null, label: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Falta ${label}.`);
  }

  return value.trim();
}

async function maybeUploadFile(
  file: FormDataEntryValue | null,
  slug: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  folder: "images" | "audio"
) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const fallbackExtension = folder === "audio" ? "mp3" : "jpg";
  const extension = (file.name.split(".").pop() ?? fallbackExtension).toLowerCase();

  if (folder === "audio" && !["mp3", "ogg"].includes(extension)) {
    throw new Error("El audio debe ser .mp3 u .ogg.");
  }

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

async function maybeUpload360Image(
  file: FormDataEntryValue | null,
  slug: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const path = `portales/360/${slug}.jpg`;

  const { error } = await supabase.storage
    .from(supabaseStorageBucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg",
    });

  if (error) {
    throw new Error(`No se pudo subir la imagen 360: ${error.message}`);
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
  audioUrl: string | null
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
    audio_url: audioUrl,
    status: parseRequiredString(formData.get("status"), "status"),
  };
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
  console.log([...formData.entries()]);
  console.log("FORM DATA", Object.fromEntries(formData.entries()));
  const tituloRaw = formData.get("titulo");
  const titulo = typeof tituloRaw === "string" ? tituloRaw.trim() : "";

  if (!titulo || titulo.length === 0) {
    throw new Error("Falta titulo");
  }

  const supabase = await requireAdminSession();
  const slug = parseRequiredString(formData.get("slug"), "slug");
  const uploadedImageUrl = await maybeUploadFile(
    formData.get("imageFile"),
    slug,
    supabase,
    "images"
  );
  const uploadedAudioUrl = await maybeUploadFile(
    formData.get("audioFile"),
    slug,
    supabase,
    "audio"
  );
  const uploadedImage360Url = await maybeUpload360Image(
    formData.get("image360File"),
    slug,
    supabase
  );
  const currentImageUrl =
    typeof formData.get("imageUrl") === "string"
      ? formData.get("imageUrl")!.toString().trim()
      : "";
  const currentAudioUrl =
    typeof formData.get("audioUrl") === "string"
      ? formData.get("audioUrl")!.toString().trim()
      : "";
  const currentImage360Url = null;
  const audioUrl = uploadedAudioUrl ?? (currentAudioUrl || null);
  const image360Url = uploadedImage360Url ?? currentImage360Url;
  const payload = buildPortalPayload(
    formData,
    titulo,
    uploadedImageUrl ?? currentImageUrl,
    image360Url,
    audioUrl
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
  console.log([...formData.entries()]);
  console.log("FORM DATA", Object.fromEntries(formData.entries()));
  const tituloRaw = formData.get("titulo");
  const titulo = typeof tituloRaw === "string" ? tituloRaw.trim() : "";

  if (!titulo || titulo.length === 0) {
    throw new Error("Falta titulo");
  }

  const supabase = await requireAdminSession();
  const slug = parseRequiredString(formData.get("slug"), "slug");
  const uploadedImageUrl = await maybeUploadFile(
    formData.get("imageFile"),
    slug,
    supabase,
    "images"
  );
  const uploadedAudioUrl = await maybeUploadFile(
    formData.get("audioFile"),
    slug,
    supabase,
    "audio"
  );
  const uploadedImage360Url = await maybeUpload360Image(
    formData.get("image360File"),
    slug,
    supabase
  );
  const currentImageUrl =
    typeof formData.get("imageUrl") === "string"
      ? formData.get("imageUrl")!.toString().trim()
      : "";
  const currentAudioUrl =
    typeof formData.get("audioUrl") === "string"
      ? formData.get("audioUrl")!.toString().trim()
      : "";
  const currentImage360Url =
    typeof formData.get("image360Url") === "string"
      ? formData.get("image360Url")!.toString().trim()
      : "";
  const audioUrl = uploadedAudioUrl ?? (currentAudioUrl || null);
  const image360Url = uploadedImage360Url ?? (currentImage360Url || null);
  const payload = buildPortalPayload(
    formData,
    titulo,
    uploadedImageUrl ?? currentImageUrl,
    image360Url,
    audioUrl
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
