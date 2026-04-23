"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseStorageBucket } from "@/lib/supabase/config";
import { MapRecord } from "@/lib/types";

type MapFormProps = {
  map?: MapRecord;
  action: (formData: FormData) => void | Promise<void>;
};

type ValidationErrors = Partial<Record<"slug" | "titulo" | "imageUrl" | "upload", string>>;

function Field({
  label,
  name,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-technical"
      />
      {error ? <p className="text-sm text-technical">{error}</p> : null}
    </label>
  );
}

function validateMap({
  slug,
  titulo,
  imageUrl,
}: {
  slug: string;
  titulo: string;
  imageUrl: string;
}) {
  const errors: ValidationErrors = {};

  if (!slug.trim()) {
    errors.slug = "Falta slug";
  }

  if (!titulo.trim()) {
    errors.titulo = "Falta titulo";
  }

  if (!imageUrl.trim()) {
    errors.imageUrl = "Falta image_url";
  }

  return errors;
}

export function MapForm({ map, action }: MapFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitBypassRef = useRef(false);
  const [slug, setSlug] = useState(map?.slug ?? "");
  const [titulo, setTitulo] = useState(map?.name ?? "");
  const [imageUrl, setImageUrl] = useState(map?.imageUrl ?? "");
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    setErrors(validateMap({ slug, titulo, imageUrl }));
  }, [slug, titulo, imageUrl]);

  async function handleMapUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!slug.trim()) {
      setUploadState("error");
      setUploadMessage("Define slug antes de subir el mapa.");
      event.target.value = "";
      return;
    }

    setUploadState("uploading");
    setUploadMessage("Subiendo mapa...");

    try {
      const supabase = createClient();
      const extension = (file.name.split(".").pop() ?? "png").toLowerCase();
      const timestamp = Date.now();
      const normalizedExtension =
        extension === "jpg" || extension === "jpeg" ? "jpg" : "png";
      const path = `maps/${slug}-${timestamp}.${normalizedExtension}`;
      const contentType =
        normalizedExtension === "jpg" ? "image/jpeg" : "image/png";
      const uploadFile = new File([file], `${slug}-${timestamp}.${normalizedExtension}`, {
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

      setImageUrl(publicUrl);
      setUploadState("success");
      setUploadMessage("Mapa subido.");
      event.target.value = "";
    } catch (error) {
      setUploadState("error");
      setUploadMessage(
        error instanceof Error ? error.message : "No se pudo subir el mapa."
      );
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitBypassRef.current) {
      submitBypassRef.current = false;
      return;
    }

    const nextErrors = validateMap({ slug, titulo, imageUrl });
    setErrors(nextErrors);

    if (uploadState === "uploading") {
      event.preventDefault();
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      return;
    }

    if (fileInputRef.current?.files?.length) {
      event.preventDefault();
      await handleMapUpload({ target: fileInputRef.current } as ChangeEvent<HTMLInputElement>);

      if (!imageUrl.trim()) {
        return;
      }

      submitBypassRef.current = true;
      formRef.current?.requestSubmit();
    }
  }

  const isInvalid = useMemo(
    () => uploadState === "uploading" || Object.keys(errors).length > 0,
    [errors, uploadState]
  );

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={handleSubmit}
      className="flex flex-col gap-10"
    >
      <div className="grid gap-6">
        <Field
          label="slug"
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.currentTarget.value)}
          error={errors.slug}
        />
        <Field
          label="título"
          name="titulo"
          value={titulo}
          onChange={(event) => setTitulo(event.currentTarget.value)}
          error={errors.titulo}
        />
        <Field
          label="image_url"
          name="imageUrl"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.currentTarget.value)}
          error={errors.imageUrl}
        />
      </div>

      <label className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">
          map_file
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,.png,.jpg,.jpeg"
          onChange={handleMapUpload}
          className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors file:mr-4 file:border-0 file:bg-transparent file:text-sm file:text-foreground"
        />
        <p className="quiet-label">
          formatos permitidos: png, jpg
          <br />
          mínimo recomendado: 2000 px de ancho
          <br />
          usa una imagen horizontal y limpia para colocar marcadores
        </p>
        {uploadMessage ? (
          <p className="text-sm text-technical">{uploadMessage}</p>
        ) : null}
        {errors.upload ? <p className="text-sm text-technical">{errors.upload}</p> : null}
      </label>

      {imageUrl ? (
        <div className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-muted">
            preview
          </span>
          <div className="relative aspect-[1.72/1] w-full overflow-hidden border border-line bg-[#efeee8]">
            <Image
              src={imageUrl}
              alt={titulo || "Mapa"}
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-contain object-center"
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 text-sm md:grid-cols-[auto_1fr] md:items-center">
        <button
          type="submit"
          disabled={isInvalid}
          className="w-fit border border-technical px-4 py-2 text-technical transition-colors hover:bg-technical hover:text-background disabled:opacity-50"
        >
          Guardar mapa
        </button>
      </div>
    </form>
  );
}
