import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { listAdminPortals } from "@/lib/portals";

export default async function AdminPage() {
  await requireAdminSession();
  const portals = await listAdminPortals();

  return (
    <main className="portal-shell">
      <div className="flex max-w-5xl flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <header className="flex flex-col gap-3">
            <p className="editorial-kicker">Admin</p>
            <h1 className="text-3xl leading-tight font-medium tracking-[-0.03em]">
              Archivo Portal 771
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

        <div className="field-divider" />

        <div>
          <Link
            href="/admin/new"
            className="text-sm text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Crear nuevo portal
          </Link>
        </div>

        <section className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3 pr-4 font-normal">portal_id</th>
                <th className="py-3 pr-4 font-normal">mapa_id</th>
                <th className="py-3 pr-4 font-normal">estado</th>
                <th className="py-3 font-normal">editar</th>
              </tr>
            </thead>
            <tbody>
              {portals.map((portal) => (
                <tr key={portal.id} className="border-b border-line/80">
                  <td className="py-4 pr-4 text-foreground">{portal.portalId}</td>
                  <td className="py-4 pr-4 text-muted">{portal.mapId}</td>
                  <td className="py-4 pr-4 text-muted">{portal.status}</td>
                  <td className="py-4">
                    <Link
                      href={`/admin/portal/${portal.id}`}
                      className="text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
                    >
                      editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
