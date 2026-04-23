import Image from "next/image";
import { MapRecord, Portal } from "@/lib/types";
import { MapMarker } from "./MapMarker";

type MapCanvasProps = {
  map: MapRecord;
  portals: Portal[];
};

export function MapCanvas({ map, portals }: MapCanvasProps) {
  return (
    <figure className="relative flex h-full w-full justify-center">
      <div className="relative h-full aspect-[1.72/1] w-full max-w-[1760px] overflow-visible">
        <Image
          src="/images/maps/pachuca-base.png"
          alt={map.name}
          fill
          priority
          sizes="(min-width: 1536px) 1760px, 100vw"
          className="object-contain object-center"
        />

        <div className="absolute inset-0">
          {portals.map((portal) => (
            <MapMarker key={portal.id} portal={portal} />
          ))}
        </div>
      </div>
    </figure>
  );
}
