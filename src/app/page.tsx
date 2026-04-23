import { MapCanvas } from "@/components/map/MapCanvas";
import { PublicMapSelector } from "@/components/map/PublicMapSelector";
import { PublicFooterNav } from "@/components/ui/PublicFooterNav";
import { listMaps } from "@/lib/maps";
import { listPublishedPortals } from "@/lib/portals";

type HomePageProps = {
  searchParams?: Promise<{ map?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const maps = await listMaps();
  const [{ map: requestedMapId } = {}] = await Promise.all([searchParams]);
  const [fallbackMap] = maps;
  const mapRecord =
    maps.find((map) => map.id === requestedMapId || map.slug === requestedMapId) ??
    fallbackMap;
  const portals = (await listPublishedPortals()).filter(
    (portal) => portal.mapId === mapRecord?.id
  );

  if (!mapRecord) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-[1840px] flex-col px-2 py-6 sm:py-12 md:px-3 md:pt-3 md:pb-5">
      <div className="relative flex flex-col items-center">
        <div className="flex w-full max-w-[1760px] items-end justify-between gap-4">
          <h1 className="pointer-events-none relative z-10 text-3xl leading-none font-medium tracking-[-0.05em] text-foreground sm:text-5xl md:text-[3.2rem]">
            portal 771
          </h1>
          <PublicMapSelector maps={maps} value={mapRecord.id} />
        </div>
        <section className="mt-1 w-full md:mt-2">
          <div className="w-full h-[60vh] max-h-[800px] sm:h-[70vh]">
            <MapCanvas map={mapRecord} portals={portals} />
          </div>
        </section>
      </div>
      <PublicFooterNav className="mt-2 mr-1 md:mr-3" />
    </main>
  );
}
