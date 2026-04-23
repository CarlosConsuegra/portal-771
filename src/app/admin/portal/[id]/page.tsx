import { notFound } from "next/navigation";
import { logout, updatePortal } from "@/app/admin/actions";
import { PortalForm } from "@/components/admin/PortalForm";
import { requireAdminSession } from "@/lib/admin-auth";
import { getAdminPortalById } from "@/lib/portals";

type AdminPortalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPortalPage({
  params,
}: AdminPortalPageProps) {
  await requireAdminSession();
  const { id } = await params;
  const portal = await getAdminPortalById(id);

  if (!portal) {
    notFound();
  }

  const updatePortalWithId = updatePortal.bind(null, id);

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
          <PortalForm mode="edit" portal={portal} action={updatePortalWithId} />
        </div>
      </div>
    </main>
  );
}
