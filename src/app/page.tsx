import { MapCanvas } from "@/components/map/MapCanvas";
import { PublicFooterNav } from "@/components/ui/PublicFooterNav";
import { listMaps } from "@/lib/maps";
import { listPublishedPortals } from "@/lib/portals";

export default async function HomePage() {
  const [mapRecord] = await listMaps();
  const portals = await listPublishedPortals();

  if (!mapRecord) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-[1840px] flex-col px-2 py-6 sm:py-12 md:px-3 md:pt-3 md:pb-5">
      <div className="relative flex flex-col items-center">
        <h1 className="pointer-events-none relative z-10 w-full max-w-[1760px] text-3xl leading-none font-medium tracking-[-0.05em] text-foreground sm:text-5xl md:text-[3.2rem]">
          portal 771
        </h1>
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
