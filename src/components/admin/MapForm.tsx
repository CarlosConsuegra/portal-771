import Link from "next/link";
import { MapRecord } from "@/lib/types";

type MapFormProps = {
  map?: MapRecord;
  action: (formData: FormData) => void | Promise<void>;
};

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-technical"
      />
    </label>
  );
}

export function MapForm({ map, action }: MapFormProps) {
  return (
    <form action={action} className="flex flex-col gap-10">
      <div className="grid gap-6">
        <Field label="slug" name="slug" defaultValue={map?.slug} />
        <Field label="título" name="titulo" defaultValue={map?.name} />
        <Field label="image_url" name="imageUrl" defaultValue={map?.imageUrl} />
      </div>

      <div className="grid gap-4 text-sm md:grid-cols-[auto_auto_1fr] md:items-center">
        <button
          type="submit"
          className="w-fit border border-technical px-4 py-2 text-technical transition-colors hover:bg-technical hover:text-background"
        >
          Guardar mapa
        </button>
        <Link
          href="/admin/mapas"
          className="w-fit text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Volver a mapas
        </Link>
      </div>
    </form>
  );
}
