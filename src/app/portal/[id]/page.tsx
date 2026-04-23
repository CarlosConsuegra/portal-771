import { notFound } from "next/navigation";
import { EditorialLink } from "@/components/ui/EditorialLink";
import { PortalMedia } from "@/components/portal/PortalMedia";
import { PortalNarrative } from "@/components/portal/PortalNarrative";
import { PublicFooterNav } from "@/components/ui/PublicFooterNav";
import { getPublishedPortalBySlug } from "@/lib/portals";

type PortalPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ map?: string }>;
};

export default async function PortalPage({ params, searchParams }: PortalPageProps) {
  const { id } = await params;
  const { map: requestedMapId } = (await searchParams) ?? {};
  const portal = await getPublishedPortalBySlug(id);

  if (!portal || portal.status !== "published") {
    notFound();
  }

  const currentMapId = requestedMapId || portal.mapId;
  const mapHref = currentMapId ? `/?map=${encodeURIComponent(currentMapId)}` : "/";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1760px] flex-col px-4 pt-3 pb-4 sm:px-8 md:px-5 md:pt-4 md:pb-5">
      <div className="max-w-5xl">
        <EditorialLink href={mapHref}>volver al mapa</EditorialLink>
      </div>

      <section className="mt-2 flex flex-1 flex-col gap-1.5 md:mt-3 md:gap-2">
        <h1 className="text-[2.45rem] leading-none font-medium tracking-[-0.05em] text-foreground md:text-[3rem]">
          portal 771
        </h1>
        <PortalMedia
          title={portal.title}
          imageUrl={portal.imageUrl}
          imageUrl360={portal.imageUrl360}
        />
        <PortalNarrative
          narrative={portal.narrative}
          audioUrl={portal.audioUrl}
        />
      </section>
      <PublicFooterNav className="mt-2" />
    </main>
  );
}
