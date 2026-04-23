"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseStorageBucket } from "@/lib/supabase/config";
import { Portal } from "@/lib/types";

type PortalFormProps = {
  mode: "create" | "edit";
  portal?: Portal;
  action: (formData: FormData) => void | Promise<void>;
};

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number;
  value?: string;
  rows?: number;
  type?: string;
  error?: string;
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

type ValidationErrors = Partial<
  Record<
    | "global"
    | "slug"
    | "titulo"
    | "mapId"
    | "marker"
    | "narrative"
    | "image360"
    | "audio",
    string
  >
>;

function Field({
  label,
  name,
  defaultValue,
  value,
  rows,
  type = "text",
  error,
  inputRef,
  onChange,
}: FieldProps) {
  const baseClassName =
    "min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-technical";

  return (
    <label className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      {rows ? (
        <textarea
          ref={inputRef as RefObject<HTMLTextAreaElement>}
          name={name}
          rows={rows}
          {...(value !== undefined ? { value } : { defaultValue })}
          onChange={onChange}
          className={`${baseClassName} resize-y`}
        />
      ) : (
        <input
          ref={inputRef as RefObject<HTMLInputElement>}
          type={type}
          name={name}
          {...(value !== undefined ? { value } : { defaultValue })}
          onChange={onChange}
          className={baseClassName}
        />
      )}
      {error ? <p className="text-sm text-technical">{error}</p> : null}
    </label>
  );
}

function parseTrimmed(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function hasFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0;
}

function validatePublishedData(formData: FormData): ValidationErrors {
  const errors: ValidationErrors = {};
  const slug = parseTrimmed(formData.get("slug"));
  const titulo = parseTrimmed(formData.get("titulo"));
  const mapId = parseTrimmed(formData.get("mapId"));
  const markerX = parseTrimmed(formData.get("markerX"));
  const markerY = parseTrimmed(formData.get("markerY"));
  const narrative = parseTrimmed(formData.get("narrative"));
  const imageUrl = parseTrimmed(formData.get("imageUrl"));
  const image360Url = parseTrimmed(formData.get("image_360_url"));
  const hasImageFile = hasFile(formData.get("imageFile"));

  if (!slug) {
    errors.slug = "Falta slug";
  }

  if (!titulo) {
    errors.titulo = "Falta titulo";
  }

  if (!mapId) {
    errors.mapId = "Falta mapa_id";
  }

  const hasValidMarkerX = markerX !== "" && Number.isFinite(Number(markerX));
  const hasValidMarkerY = markerY !== "" && Number.isFinite(Number(markerY));

  if (!hasValidMarkerX || !hasValidMarkerY) {
    errors.marker = "Faltan coordenadas del marcador";
  }

  if (!narrative) {
    errors.narrative = "Falta narrativa";
  }

  if (!imageUrl && !hasImageFile && !image360Url) {
    errors.image360 = "Falta imagen";
  }

  if (Object.keys(errors).length > 0) {
    errors.global = "Faltan campos obligatorios para publicar";
  }

  return errors;
}

export function PortalForm({ mode, portal, action }: PortalFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const image360InputRef = useRef<HTMLInputElement>(null);
  const image360UrlRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioUrlRef = useRef<HTMLInputElement>(null);
  const submitBypassRef = useRef(false);
  const slugRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [statusValue, setStatusValue] = useState(portal?.status ?? "draft");
  const [image360Url, setImage360Url] = useState(portal?.imageUrl360 ?? "");
  const [audioUrl, setAudioUrl] = useState(portal?.audioUrl ?? "");
  const [image360UploadState, setImage360UploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [image360UploadMessage, setImage360UploadMessage] = useState("");
  const [audioUploadState, setAudioUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [audioUploadMessage, setAudioUploadMessage] = useState("");

  const isPublishedMode = useMemo(
    () => statusValue.trim().toLowerCase() === "published",
    [statusValue]
  );

  const syncValidation = useCallback(() => {
    if (!formRef.current) {
      return {};
    }

    const nextFormData = new FormData(formRef.current);
    const nextStatus = parseTrimmed(nextFormData.get("status"));
    setStatusValue(nextStatus);

    const nextErrors =
      nextStatus.toLowerCase() === "published"
        ? validatePublishedData(nextFormData)
        : {};

    setErrors(nextErrors);
    return nextErrors;
  }, []);

  useEffect(() => {
    syncValidation();
  }, [syncValidation]);

  async function handle360Upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const slug = slugRef.current?.value.trim() ?? "";

    if (!slug) {
      setImage360UploadState("error");
      setImage360UploadMessage("Define slug antes de subir imagen 360.");
      event.target.value = "";
      return;
    }

    setImage360UploadState("uploading");
    setImage360UploadMessage("Subiendo 360...");

    try {
      const supabase = createClient();
      const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const timestamp = Date.now();
      const path = `portales/360/${slug}-${timestamp}.jpg`;
      const contentType = file.type || "image/jpeg";
      const uploadFile =
        extension === "jpg" || extension === "jpeg"
          ? file
          : new File([file], `${slug}-${timestamp}.jpg`, {
              type: contentType,
            });

      const { error } = await supabase.storage
        .from(supabaseStorageBucket)
        .upload(path, uploadFile, {
          cacheControl: "3600",
          upsert: false,
          contentType,
        });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(path);

      setImage360Url(publicUrl);
      if (image360UrlRef.current) {
        image360UrlRef.current.value = publicUrl;
      }
      event.target.value = "";
      setImage360UploadState("success");
      setImage360UploadMessage("Imagen 360 subida.");
      syncValidation();
    } catch (error) {
      setImage360UploadState("error");
      setImage360UploadMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen 360."
      );
      event.target.value = "";
    }
  }

  async function handleAudioUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const slug = slugRef.current?.value.trim() ?? "";

    if (!slug) {
      setAudioUploadState("error");
      setAudioUploadMessage("Define slug antes de subir audio.");
      event.target.value = "";
      return;
    }

    setAudioUploadState("uploading");
    setAudioUploadMessage("Subiendo audio...");

    try {
      const supabase = createClient();
      const timestamp = Date.now();
      const path = `portales/audio/${slug}-${timestamp}.mp3`;
      const contentType = file.type || "audio/mpeg";
      const uploadFile = new File([file], `${slug}-${timestamp}.mp3`, {
        type: contentType,
      });

      const { error } = await supabase.storage
        .from(supabaseStorageBucket)
        .upload(path, uploadFile, {
          cacheControl: "3600",
          upsert: false,
          contentType,
        });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(path);

      setAudioUrl(publicUrl);
      if (audioUrlRef.current) {
        audioUrlRef.current.value = publicUrl;
      }
      event.target.value = "";
      setAudioUploadState("success");
      setAudioUploadMessage("Audio subido.");
      setErrors((current) => ({ ...current, audio: undefined }));
    } catch (error) {
      setAudioUploadState("error");
      setAudioUploadMessage(
        error instanceof Error ? error.message : "No se pudo subir el audio."
      );
      setErrors((current) => ({
        ...current,
        audio: "No se pudo subir el audio.",
      }));
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitBypassRef.current) {
      submitBypassRef.current = false;
      return;
    }

    const nextErrors = syncValidation();

    if (
      image360UploadState === "uploading" ||
      audioUploadState === "uploading"
    ) {
      event.preventDefault();
      setErrors({
        ...nextErrors,
        global: "Espera a que terminen las cargas pendientes.",
      });
      return;
    }

    if (isPublishedMode && Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      return;
    }

    if (image360InputRef.current?.files?.length || audioInputRef.current?.files?.length) {
      event.preventDefault();
      if (image360InputRef.current?.files?.length) {
        await handle360Upload({
          target: image360InputRef.current,
        } as ChangeEvent<HTMLInputElement>);
      }
      if (audioInputRef.current?.files?.length) {
        await handleAudioUpload({
          target: audioInputRef.current,
        } as ChangeEvent<HTMLInputElement>);
      }

      const image360UploadedOk =
        image360UrlRef.current?.value.trim() || !image360InputRef.current?.value;
      const audioUploadedOk =
        audioUrlRef.current?.value.trim() || !audioInputRef.current?.value;

      if (!image360UploadedOk || !audioUploadedOk) {
        setErrors((current) => ({
          ...current,
          global: "No se pudieron completar las cargas pendientes.",
        }));
        return;
      }

      const finalErrors = syncValidation();

      if (isPublishedMode && Object.keys(finalErrors).length > 0) {
        return;
      }

      submitBypassRef.current = true;
      formRef.current?.requestSubmit();
    }
  }

  const disableSubmit =
    image360UploadState === "uploading" ||
    audioUploadState === "uploading" ||
    (isPublishedMode && Object.keys(errors).length > 0);

  return (
    <form
      ref={formRef}
      action={action}
      onChange={syncValidation}
      onSubmit={handleSubmit}
      className="flex flex-col gap-10"
    >
      <input
        ref={image360UrlRef}
        type="hidden"
        name="image_360_url"
        value={image360Url}
        readOnly
      />
      <input
        ref={audioUrlRef}
        type="hidden"
        name="audio_url"
        value={audioUrl}
        readOnly
      />

      {errors.global ? <p className="text-sm text-technical">{errors.global}</p> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          inputRef={slugRef}
          label="slug"
          name="slug"
          defaultValue={portal?.slug}
          error={errors.slug}
        />
        <Field
          label="mapa_id"
          name="mapId"
          defaultValue={portal?.mapId ?? "mapa-771"}
          error={errors.mapId}
        />
        <Field
          label="título"
          name="titulo"
          defaultValue={portal?.title}
          error={errors.titulo}
        />
        <Field
          label="estado"
          name="status"
          defaultValue={portal?.status ?? "draft"}
        />
        <Field
          label="marker_x"
          name="markerX"
          defaultValue={portal?.markerX}
          error={errors.marker}
        />
        <Field
          label="marker_y"
          name="markerY"
          defaultValue={portal?.markerY}
          error={errors.marker}
        />
        <Field
          label="image_url"
          name="imageUrl"
          defaultValue={portal?.imageUrl}
          error={errors.image360}
        />
        <Field
          label="image_360_url"
          name="image_360_url_display"
          value={image360Url}
          onChange={(event) => setImage360Url(event.currentTarget.value)}
        />
        <Field
          label="audio_url"
          name="audio_url_display"
          value={audioUrl}
          onChange={(event) => setAudioUrl(event.currentTarget.value)}
          error={errors.audio}
        />
      </div>

      <label className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">
          image_file
        </span>
        <input
          type="file"
          name="imageFile"
          accept="image/*"
          className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors file:mr-4 file:border-0 file:bg-transparent file:text-sm file:text-foreground"
        />
      </label>

      <label className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">
          image_360_file
        </span>
        <input
          ref={image360InputRef}
          type="file"
          accept="image/*"
          onChange={handle360Upload}
          className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors file:mr-4 file:border-0 file:bg-transparent file:text-sm file:text-foreground"
        />
        {image360UploadMessage ? (
          <p className="text-sm text-technical">{image360UploadMessage}</p>
        ) : null}
        {errors.image360 ? (
          <p className="text-sm text-technical">{errors.image360}</p>
        ) : null}
      </label>

      <label className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">
          audio_file
        </span>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/mpeg,audio/ogg,.mp3,.ogg"
          onChange={handleAudioUpload}
          className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors file:mr-4 file:border-0 file:bg-transparent file:text-sm file:text-foreground"
        />
        {audioUploadMessage ? (
          <p className="text-sm text-technical">{audioUploadMessage}</p>
        ) : null}
        {errors.audio ? <p className="text-sm text-technical">{errors.audio}</p> : null}
      </label>

      <Field
        label="narrativa"
        name="narrative"
        defaultValue={portal?.narrative}
        rows={6}
        error={errors.narrative}
      />

      <div className="grid gap-4 text-sm md:grid-cols-[auto_auto_1fr] md:items-center">
        <button
          type="submit"
          disabled={disableSubmit}
          className="w-fit border border-technical px-4 py-2 text-technical transition-colors hover:bg-technical hover:text-background disabled:opacity-50"
        >
          {mode === "create" ? "Guardar borrador" : "Actualizar portal"}
        </button>
        <Link
          href="/admin"
          className="w-fit text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Volver al archivo
        </Link>
        <p className="quiet-label">
          Imagen, imagen 360 y audio son opcionales. Si subes archivos, reemplazan las URLs actuales.
        </p>
      </div>
    </form>
  );
}
