import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { listMaps } from "@/lib/maps";

export default async function AdminMapsPage() {
  await requireAdminSession();
  const maps = await listMaps();

  return (
    <main className="portal-shell">
      <div className="flex max-w-5xl flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <header className="flex flex-col gap-3">
            <p className="editorial-kicker">Admin</p>
            <h1 className="text-3xl leading-tight font-medium tracking-[-0.03em]">
              Mapas
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

        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-sm text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            volver al archivo
          </Link>
          <Link
            href="/admin/mapas/new"
            className="text-sm text-technical underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            Crear nuevo mapa
          </Link>
        </div>

        <section className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3 pr-4 font-normal">slug</th>
                <th className="py-3 pr-4 font-normal">titulo</th>
                <th className="py-3 font-normal">editar</th>
              </tr>
            </thead>
            <tbody>
              {maps.map((map) => (
                <tr key={map.id} className="border-b border-line/80">
                  <td className="py-4 pr-4 text-foreground">{map.slug}</td>
                  <td className="py-4 pr-4 text-muted">{map.name}</td>
                  <td className="py-4">
                    <Link
                      href={`/admin/mapas/${map.id}`}
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
