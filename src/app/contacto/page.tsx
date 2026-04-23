import { ContactForm } from "@/components/contact/ContactForm";
import { EditorialLink } from "@/components/ui/EditorialLink";
import { PublicFooterNav } from "@/components/ui/PublicFooterNav";

export default function ContactoPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8">
      <div>
        <EditorialLink href="/">regresar</EditorialLink>
      </div>

      <section className="mt-8 max-w-[30rem] flex-1">
        <h1 className="text-[2.2rem] leading-none font-medium tracking-[-0.05em] text-foreground md:text-[2.8rem]">
          contacto
        </h1>
        <ContactForm />
      </section>

      <PublicFooterNav
        className="mt-8"
        primaryHref="/"
        primaryLabel="portal 771"
      />
    </main>
  );
}
