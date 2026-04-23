import { notFound } from "next/navigation";
import { deletePortal, logout, updatePortal } from "@/app/admin/actions";
import { DeletePortalButton } from "@/components/admin/DeletePortalButton";
import { PortalForm } from "@/components/admin/PortalForm";
import { requireAdminSession } from "@/lib/admin-auth";
import { listMaps } from "@/lib/maps";
import { getAdminPortalById } from "@/lib/portals";
import Link from "next/link";

type AdminPortalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPortalPage({
  params,
}: AdminPortalPageProps) {
  await requireAdminSession();
  const { id } = await params;
  const portal = await getAdminPortalById(id);
  const maps = await listMaps();

  if (!portal) {
    notFound();
  }

  const updatePortalWithId = updatePortal.bind(null, id);
  const deletePortalWithId = deletePortal.bind(null, id);

  return (
    <main className="portal-shell">
      <div className="max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <header className="flex flex-col gap-3">
            <p className="editorial-kicker">Admin</p>
            <h1 className="text-3xl leading-tight font-medium tracking-[-0.03em]">
              Editar portal
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
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              href="/admin"
              className="inline-flex text-sm text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              volver al archivo
            </Link>
            <DeletePortalButton action={deletePortalWithId} />
          </div>
          <PortalForm
            mode="edit"
            portal={portal}
            maps={maps}
            action={updatePortalWithId}
          />
        </div>
      </div>
    </main>
  );
}
