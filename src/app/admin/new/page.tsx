import { createPortal, logout } from "@/app/admin/actions";
import { PortalForm } from "@/components/admin/PortalForm";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function NewPortalPage() {
  await requireAdminSession();

  return (
    <main className="portal-shell">
      <div className="max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <header className="flex flex-col gap-3">
            <p className="editorial-kicker">Admin</p>
            <h1 className="text-3xl leading-tight font-medium tracking-[-0.03em]">
              Nuevo portal
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
          <PortalForm mode="create" action={createPortal} />
        </div>
      </div>
    </main>
  );
}
