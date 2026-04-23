import Link from "next/link";
import { notFound } from "next/navigation";
import { logout, updateMap } from "@/app/admin/actions";
import { MapForm } from "@/components/admin/MapForm";
import { requireAdminSession } from "@/lib/admin-auth";
import { getMapById } from "@/lib/maps";

type AdminMapPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMapPage({ params }: AdminMapPageProps) {
  await requireAdminSession();
  const { id } = await params;
  const map = await getMapById(id);

  if (!map) {
    notFound();
  }

  const updateMapWithId = updateMap.bind(null, id);

  return (
    <main className="portal-shell">
      <div className="max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <header className="flex flex-col gap-3">
            <p className="editorial-kicker">Admin</p>
            <h1 className="text-3xl leading-tight font-medium tracking-[-0.03em]">
              Editar mapa
            </h1>
          </header>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              cerrar sesión
            </button>
          </form>
        </div>

        <div className="mt-8 field-divider" />

        <div className="mt-10">
          <Link
            href="/admin/mapas"
            className="mb-6 inline-flex text-sm text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            volver a mapas
          </Link>
          <MapForm map={map} action={updateMapWithId} />
        </div>
      </div>
    </main>
  );
}
