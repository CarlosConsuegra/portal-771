import Link from "next/link";
import { Portal } from "@/lib/types";

type MapMarkerProps = {
  portal: Portal;
};

export function MapMarker({ portal }: MapMarkerProps) {
  const variant = portal.portalId.charCodeAt(portal.portalId.length - 1) % 3;
  const markerSize = variant === 0 ? "3rem" : variant === 1 ? "2.75rem" : "2.9rem";
  const crossLength = variant === 0 ? "1.45rem" : variant === 1 ? "1.3rem" : "1.38rem";
  const strokeWidth = variant === 0 ? "3px" : "2.75px";

  return (
    <Link
      href={`/portal/${portal.slug}`}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${portal.markerX}%`,
        top: `${portal.markerY}%`,
      }}
      aria-label={`Abrir ${portal.title}`}
    >
      <span className="flex flex-col items-center gap-2">
        <span
          className="relative flex items-center justify-center rounded-full border-technical bg-background/88 transition-transform duration-200 group-hover:scale-[1.05] group-focus-visible:scale-[1.05]"
          style={{
            width: markerSize,
            height: markerSize,
            borderWidth: strokeWidth,
          }}
        >
          <span
            className="absolute bg-technical"
            style={{
              width: strokeWidth,
              height: crossLength,
            }}
          />
          <span
            className="absolute bg-technical"
            style={{
              width: crossLength,
              height: strokeWidth,
            }}
          />
        </span>
        <span className="pointer-events-none absolute top-full mt-3 whitespace-nowrap bg-background/72 px-1.5 py-0.5 text-[0.66rem] uppercase tracking-[0.18em] text-technical opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
          {portal.portalId}
        </span>
      </span>
    </Link>
  );
}
