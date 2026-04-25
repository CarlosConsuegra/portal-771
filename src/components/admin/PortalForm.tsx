"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  type RefObject,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { supabaseStorageBucket } from "@/lib/supabase/config";
import {
  initialSavePortalState,
  type SavePortalState,
} from "@/components/admin/savePortalState";
import { extractYouTubeVideoId } from "@/lib/youtube";
import { MapRecord, Portal, PortalMediaType } from "@/lib/types";

type PortalFormProps = {
  mode: "create" | "edit";
  portal?: Portal;
  maps: MapRecord[];
  action: (
    state: SavePortalState,
    formData: FormData
  ) => SavePortalState | Promise<SavePortalState>;
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

type SelectFieldProps = {
  label: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

type ValidationErrors = Partial<
  Record<
    | "global"
    | "slug"
    | "titulo"
    | "mapId"
    | "marker"
    | "narrative"
    | "media"
    | "audio",
    string
  >
>;

const MEDIA_TYPE_OPTIONS: Array<{ value: PortalMediaType; label: string }> = [
  { value: "image_2d", label: "Imagen 2D" },
  { value: "image_360", label: "Imagen 360" },
  { value: "youtube_360", label: "YouTube 360" },
  { value: "video_360", label: "Video 360" },
];

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

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
}: SelectFieldProps) {
  const baseClassName =
    "min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-technical";

  return (
    <label className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={baseClassName}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
  const mediaType =
    (parseTrimmed(formData.get("mediaType")) as PortalMediaType) || "image_2d";
  const imageUrl = parseTrimmed(formData.get("imageUrl"));
  const image360Url = parseTrimmed(formData.get("image_360_url"));
  const video360Url = parseTrimmed(formData.get("video_360_url"));
  const youtubeVideoInput = parseTrimmed(formData.get("youtubeVideoInput"));
  const youtubeVideoId = extractYouTubeVideoId(youtubeVideoInput);
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

  if (mediaType === "image_2d" && !imageUrl && !hasImageFile) {
    errors.media = "Falta imagen";
  }

  if (mediaType === "image_360" && !image360Url) {
    errors.media = "Falta imagen 360";
  }

  if (mediaType === "video_360" && !video360Url) {
    errors.media = "Falta video 360";
  }

  if (mediaType === "youtube_360" && !youtubeVideoId) {
    errors.media = "Falta video de YouTube 360 valido";
  }

  if (Object.keys(errors).length > 0) {
    errors.global = "Faltan campos obligatorios para publicar";
  }

  return errors;
}

export function PortalForm({ mode, portal, maps, action }: PortalFormProps) {
  const [saveState, formAction, isPending] = useActionState(
    action,
    initialSavePortalState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const image360InputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioUrlRef = useRef<HTMLInputElement>(null);
  const submitBypassRef = useRef(false);
  const slugRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [statusValue, setStatusValue] = useState(portal?.status ?? "draft");
  const [mediaType, setMediaType] = useState<PortalMediaType>(
    portal?.mediaType ?? (portal?.imageUrl360 ? "image_360" : "image_2d")
  );
  const [mapId, setMapId] = useState(portal?.mapId ?? maps[0]?.id ?? "mapa-771");
  const [image360Url, setImage360Url] = useState(portal?.imageUrl360 ?? "");
  const [video360Url, setVideo360Url] = useState(portal?.video360Url ?? "");
  const [youtubeVideoInput, setYouTubeVideoInput] = useState(
    portal?.youtubeVideoId ?? ""
  );
  const [audioUrl, setAudioUrl] = useState(portal?.audioUrl ?? "");
  const [markerX, setMarkerX] = useState(
    portal?.markerX !== undefined ? String(portal.markerX) : ""
  );
  const [markerY, setMarkerY] = useState(
    portal?.markerY !== undefined ? String(portal.markerY) : ""
  );
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
  const selectedMap = useMemo(
    () => maps.find((map) => map.id === mapId) ?? maps[0] ?? null,
    [maps, mapId]
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

  function handleMapClick(event: MouseEvent<HTMLButtonElement>) {
    if (!selectedMap) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = ((event.clientX - rect.left) / rect.width) * 100;
    const nextY = ((event.clientY - rect.top) / rect.height) * 100;
    setMarkerX(nextX.toFixed(2));
    setMarkerY(nextY.toFixed(2));
  }

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
      isPending ||
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
        image360Url.trim() || !image360InputRef.current?.value;
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
      return;
    }

    if (isPublishedMode && Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  }

  const disableSubmit =
    isPending ||
    image360UploadState === "uploading" ||
    audioUploadState === "uploading" ||
    (isPublishedMode && Object.keys(errors).length > 0);

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={syncValidation}
      onSubmit={handleSubmit}
      className="flex flex-col gap-10"
    >
      <input ref={audioUrlRef} type="hidden" name="audio_url" value={audioUrl} readOnly />

      {errors.global ? <p className="text-sm text-technical">{errors.global}</p> : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          inputRef={slugRef}
          label="slug"
          name="slug"
          defaultValue={portal?.slug}
          error={errors.slug}
        />
        <SelectField
          label="mapa_id"
          name="mapId"
          value={mapId}
          onChange={(event) => setMapId(event.currentTarget.value)}
          options={maps.map((map) => ({ value: map.id, label: map.id }))}
        />
        <Field
          label="título"
          name="titulo"
          defaultValue={portal?.title}
          error={errors.titulo}
        />
        <SelectField
          label="tipo de medio"
          name="mediaType"
          value={mediaType}
          onChange={(event) => setMediaType(event.currentTarget.value as PortalMediaType)}
          options={MEDIA_TYPE_OPTIONS}
        />
        <SelectField
          label="estado"
          name="status"
          value={statusValue}
          onChange={(event) => setStatusValue(event.currentTarget.value)}
          options={[
            { value: "draft", label: "draft" },
            { value: "published", label: "published" },
          ]}
        />
        <Field
          label="marker_x"
          name="markerX"
          value={markerX}
          onChange={(event) => setMarkerX(event.currentTarget.value)}
          error={errors.marker}
        />
        <Field
          label="marker_y"
          name="markerY"
          value={markerY}
          onChange={(event) => setMarkerY(event.currentTarget.value)}
          error={errors.marker}
        />
        <Field
          label="image_url"
          name="imageUrl"
          defaultValue={portal?.imageUrl}
          error={mediaType === "image_2d" ? errors.media : undefined}
        />
        <Field
          label="audio_url"
          name="audio_url_display"
          value={audioUrl}
          onChange={(event) => setAudioUrl(event.currentTarget.value)}
          error={errors.audio}
        />
      </div>

      {mediaType === "youtube_360" ? (
        <Field
          label="youtube_360"
          name="youtubeVideoInput"
          value={youtubeVideoInput}
          onChange={(event) => setYouTubeVideoInput(event.currentTarget.value)}
          error={errors.media}
        />
      ) : mediaType === "video_360" ? (
        <Field
          label="video_360_url"
          name="video_360_url"
          value={video360Url}
          onChange={(event) => setVideo360Url(event.currentTarget.value)}
          error={errors.media}
        />
      ) : (
        <Field
          label="image_360_url"
          name="image_360_url"
          value={image360Url}
          onChange={(event) => setImage360Url(event.currentTarget.value)}
          error={mediaType === "image_360" ? errors.media : undefined}
        />
      )}

      {selectedMap ? (
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-muted">
            selector de marcador
          </span>
          <button
            type="button"
            onClick={handleMapClick}
            className="relative aspect-[1.72/1] w-full overflow-hidden border border-line bg-[#efeee8] text-left"
          >
            <Image
              src={selectedMap.imageUrl}
              alt={selectedMap.name}
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-contain object-center"
            />
            {markerX !== "" && markerY !== "" ? (
              <span
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-technical bg-background/90"
                style={{
                  left: `${markerX}%`,
                  top: `${markerY}%`,
                }}
              />
            ) : null}
          </button>
          <p className="quiet-label">
            Haz clic sobre el mapa para fijar marker_x y marker_y.
          </p>
        </div>
      ) : null}

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

      {mediaType === "image_360" ? (
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
        </label>
      ) : null}

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
          {isPending
            ? "Guardando..."
            : mode === "create"
              ? "Guardar borrador"
              : "Actualizar portal"}
        </button>
        <Link
          href="/admin"
          className="w-fit text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Volver al archivo
        </Link>
        <div className="flex flex-col gap-2">
          <p className="quiet-label">
            Imagen, imagen 360, video 360, YouTube 360 y audio son opcionales. Si subes archivos, reemplazan las URLs actuales.
          </p>
          {saveState.message ? (
            <p
              className={
                saveState.status === "error"
                  ? "text-sm text-technical"
                  : "text-sm text-foreground"
              }
            >
              {saveState.message}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
