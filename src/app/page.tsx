import { MapCanvas } from "@/components/map/MapCanvas";
import { PublicFooterNav } from "@/components/ui/PublicFooterNav";
import { maps } from "@/data/maps";
import { listPublishedPortals } from "@/lib/portals";

export default async function HomePage() {
  const [mapRecord] = maps;
  const portals = await listPublishedPortals();

  return (
    <main className="mx-auto flex w-full max-w-[1840px] flex-col px-2 pt-2 pb-4 md:px-3 md:pt-3 md:pb-5">
      <div className="relative flex flex-col items-center">
        <h1 className="pointer-events-none relative z-10 w-full max-w-[1760px] text-[2.55rem] leading-none font-medium tracking-[-0.05em] text-foreground md:text-[3.2rem]">
          portal 771
        </h1>
        <section className="mt-1 w-full md:mt-2">
          <div className="w-full h-[70vh] max-h-[800px]">
            <MapCanvas map={mapRecord} portals={portals} />
          </div>
        </section>
      </div>
      <PublicFooterNav className="mt-2 mr-1 md:mr-3" />
    </main>
  );
}
