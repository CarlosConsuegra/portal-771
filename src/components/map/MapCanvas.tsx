"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapRecord, Portal } from "@/lib/types";
import { MapMarker } from "./MapMarker";

type MapCanvasProps = {
  map: MapRecord;
  portals: Portal[];
};

type Bounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function MapCanvas({ map, portals }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 1720, height: 1000 });
  const [bounds, setBounds] = useState<Bounds>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const updateBounds = useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    if (!containerWidth || !containerHeight) {
      return;
    }

    const imageAspectRatio = naturalSize.width / naturalSize.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let width = containerWidth;
    let height = containerHeight;
    let left = 0;
    let top = 0;

    if (containerAspectRatio > imageAspectRatio) {
      height = containerHeight;
      width = height * imageAspectRatio;
      left = (containerWidth - width) / 2;
    } else {
      width = containerWidth;
      height = width / imageAspectRatio;
      top = (containerHeight - height) / 2;
    }

    setBounds({ left, top, width, height });
  }, [naturalSize.height, naturalSize.width]);

  useEffect(() => {
    updateBounds();

    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => updateBounds());
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [updateBounds]);

  return (
    <figure className="relative flex w-full h-full min-w-0 justify-center">
      <div
        ref={containerRef}
        className="relative w-full h-full min-w-0 max-w-full aspect-[1.72/1] overflow-hidden md:max-w-[1760px] md:overflow-visible"
      >
        <Image
          src={map.imageUrl}
          alt={map.name}
          fill
          priority
          sizes="(min-width: 1536px) 1760px, 100vw"
          className="object-contain object-center"
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth && image.naturalHeight) {
              setNaturalSize({
                width: image.naturalWidth,
                height: image.naturalHeight,
              });
            }
          }}
        />

        <div
          className="absolute"
          style={{
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
          }}
        >
          {portals.map((portal) => (
            <MapMarker key={portal.id} portal={portal} mapId={map.id} />
          ))}
        </div>
      </div>
    </figure>
  );
}
