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
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const gyroscopeRef = useRef<GyroscopePlugin | null>(null);
  const [gyroSupported, setGyroSupported] = useState(false);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [gyroError, setGyroError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const isFullscreenActive = isFullscreen || isFallbackFullscreen;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!viewerRef.current) {
      return;
    }

    document.body.style.overflow = isFullscreenActive ? "hidden" : "";
    const timeout = window.setTimeout(() => {
      viewerRef.current?.autoSize();
    }, 50);

    return () => {
      window.clearTimeout(timeout);
      document.body.style.overflow = "";
    };
  }, [isFullscreenActive]);

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

  async function toggleFullscreen() {
    if (!shellRef.current) {
      return;
    }

    const shell = shellRef.current as HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
    };

    if (document.fullscreenElement === shellRef.current) {
      await document.exitFullscreen();
      return;
    }

    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false);
      return;
    }

    try {
      if (typeof shell.requestFullscreen === "function") {
        await shell.requestFullscreen();
        return;
      }

      if (typeof shell.webkitRequestFullscreen === "function") {
        await shell.webkitRequestFullscreen();
        return;
      }

      if (
        document.fullscreenElement &&
        typeof doc.webkitExitFullscreen === "function"
      ) {
        await doc.webkitExitFullscreen();
        return;
      }
    } catch {
      // Fallback below.
    }

    setIsFallbackFullscreen(true);
  }

  return (
    <figure className="w-full">
      <div className="mt-0.5 w-full md:mt-1">
        <div
          ref={shellRef}
          className={`relative mx-auto w-full bg-background ${
            isFullscreenActive
              ? "fixed inset-0 z-50 max-w-none p-0"
              : "max-w-[1680px]"
          }`}
        >
          <div
            ref={containerRef}
            aria-label={`${title} en vista 360`}
            className={`map-paper w-full ${
              isFullscreenActive ? "h-screen max-h-none" : "h-[60vh] max-h-[70vh]"
            }`}
          />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute top-3 left-3 border border-line bg-background/92 px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em] text-foreground transition-opacity hover:opacity-70"
          >
            {isFullscreenActive ? "cerrar" : "fullscreen"}
          </button>

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
