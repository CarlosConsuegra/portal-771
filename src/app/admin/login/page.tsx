import { redirect } from "next/navigation";
import { login } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function getMessage(error?: string) {
  if (error === "config") {
    return "Configura las variables de entorno de Supabase para habilitar el admin.";
  }

  if (error === "auth") {
    return "Credenciales inválidas.";
  }

  return null;
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();

    if (claimsData?.claims) {
      redirect("/admin");
    }
  }

  const message = getMessage(params.error);

  return (
    <main className="portal-shell">
      <div className="max-w-md">
        <header className="flex flex-col gap-3">
          <p className="editorial-kicker">Admin</p>
          <h1 className="text-3xl leading-tight font-medium tracking-[-0.03em]">
            Acceso
          </h1>
        </header>

        <div className="mt-8 field-divider" />

        <form action={login} className="mt-10 flex flex-col gap-6">
          <label className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.18em] text-muted">
              email
            </span>
            <input
              type="email"
              name="email"
              required
              className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-technical"
            />
          </label>

          <label className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-[0.18em] text-muted">
              password
            </span>
            <input
              type="password"
              name="password"
              required
              className="min-h-11 w-full border border-line bg-transparent px-3 py-3 text-sm outline-none transition-colors focus:border-technical"
            />
          </label>

          {message ? <p className="text-sm text-muted">{message}</p> : null}

          <button
            type="submit"
            className="w-fit border border-technical px-4 py-2 text-technical transition-colors hover:bg-technical hover:text-background"
          >
            Ingresar
          </button>
        </form>
      </div>
    </main>
  );
}
