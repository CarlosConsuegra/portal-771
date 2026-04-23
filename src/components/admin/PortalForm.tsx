import Link from "next/link";
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
  rows?: number;
  type?: string;
};

function Field({ label, name, defaultValue, rows, type = "text" }: FieldProps) {
  const baseClassName =
    "min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-technical";

  return (
    <label className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      {rows ? (
        <textarea
          name={name}
          rows={rows}
          defaultValue={defaultValue}
          className={`${baseClassName} resize-y`}
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          className={baseClassName}
        />
      )}
    </label>
  );
}

export function PortalForm({ mode, portal, action }: PortalFormProps) {
  return (
    <form action={action} className="flex flex-col gap-10">
      <input type="hidden" name="image360Url" value={portal?.imageUrl360 ?? ""} />

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="slug" name="slug" defaultValue={portal?.slug} />
        <Field label="mapa_id" name="mapId" defaultValue={portal?.mapId ?? "mapa-771"} />
        <Field label="título" name="titulo" defaultValue={portal?.title} />
        <Field label="estado" name="status" defaultValue={portal?.status ?? "draft"} />
        <Field label="marker_x" name="markerX" defaultValue={portal?.markerX} />
        <Field label="marker_y" name="markerY" defaultValue={portal?.markerY} />
        <Field label="image_url" name="imageUrl" defaultValue={portal?.imageUrl} />
        <Field label="audio_url" name="audioUrl" defaultValue={portal?.audioUrl ?? ""} />
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
          type="file"
          name="image360File"
          accept="image/*"
          className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors file:mr-4 file:border-0 file:bg-transparent file:text-sm file:text-foreground"
        />
      </label>

      <label className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">
          audio_file
        </span>
        <input
          type="file"
          name="audioFile"
          accept="audio/mpeg,audio/ogg,.mp3,.ogg"
          className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors file:mr-4 file:border-0 file:bg-transparent file:text-sm file:text-foreground"
        />
      </label>

      <Field
        label="narrativa"
        name="narrative"
        defaultValue={portal?.narrative}
        rows={6}
      />

      <div className="grid gap-4 text-sm md:grid-cols-[auto_auto_1fr] md:items-center">
        <button
          type="submit"
          className="w-fit border border-technical px-4 py-2 text-technical transition-colors hover:bg-technical hover:text-background"
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
