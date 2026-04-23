"use client";

import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";

type Portal360ViewerProps = {
  title: string;
  panoramaUrl: string;
};

export function Portal360Viewer({
  title,
  panoramaUrl,
}: Portal360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const gyroscopeRef = useRef<GyroscopePlugin | null>(null);
  const [gyroSupported, setGyroSupported] = useState(false);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [gyroError, setGyroError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const viewer = new Viewer({
      container: containerRef.current,
      panorama: panoramaUrl,
      mousemove: true,
      touchmoveTwoFingers: false,
      navbar: false,
      loadingTxt: "cargando panorama...",
      canvasBackground: "#efeee8",
      plugins: [
        [GyroscopePlugin, { touchmove: true }],
      ],
    });

    const gyroscope = viewer.getPlugin<GyroscopePlugin>(GyroscopePlugin);
    viewerRef.current = viewer;
    gyroscopeRef.current = gyroscope;

    gyroscope.isSupported().then(setGyroSupported).catch(() => {
      setGyroSupported(false);
    });

    const handleGyroscope = () => {
      setGyroEnabled(gyroscope.isEnabled());
    };

    gyroscope.addEventListener("gyroscope-updated", handleGyroscope);

    return () => {
      gyroscope.removeEventListener("gyroscope-updated", handleGyroscope);
      gyroscopeRef.current = null;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [panoramaUrl]);

  async function toggleGyroscope() {
    const gyroscope = gyroscopeRef.current;

    if (!gyroscope) {
      return;
    }

    setGyroError(null);

    try {
      if (gyroscope.isEnabled()) {
        gyroscope.stop();
        setGyroEnabled(false);
        return;
      }

      await gyroscope.start("smooth");
      setGyroEnabled(true);
    } catch {
      setGyroError("El giroscopio requiere permiso del dispositivo.");
    }
  }

  return (
    <figure className="w-full">
      <div className="mt-0.5 w-full md:mt-1">
        <div className="relative mx-auto w-full max-w-[1680px]">
          <div
            ref={containerRef}
            aria-label={`${title} en vista 360`}
            className="map-paper h-[60vh] max-h-[70vh] w-full"
          />

          {gyroSupported ? (
            <button
              type="button"
              onClick={toggleGyroscope}
              className="absolute top-3 right-3 border border-line bg-background/92 px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em] text-foreground transition-opacity hover:opacity-70"
            >
              {gyroEnabled ? "detener giro" : "activar giro"}
            </button>
          ) : null}

          {gyroError ? (
            <p className="absolute right-3 bottom-3 max-w-[16rem] border border-line bg-background/92 px-3 py-2 text-[0.72rem] leading-relaxed text-muted">
              {gyroError}
            </p>
          ) : null}
        </div>
      </div>
    </figure>
  );
}
