"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Portal360VideoViewerProps = {
  title: string;
  videoUrl: string;
};

const MIN_LAT = -85;
const MAX_LAT = 85;
const HALF_SQRT = Math.sqrt(0.5);

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function Portal360VideoViewer({
  title,
  videoUrl,
}: Portal360VideoViewerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const motionQuaternionRef = useRef(new THREE.Quaternion());
  const motionActiveRef = useRef(false);
  const lonRef = useRef(0);
  const latRef = useRef(0);
  const interactionRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    lon: number;
    lat: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [motionError, setMotionError] = useState<string | null>(null);
  const [motionSupported] = useState(
    () => typeof window !== "undefined" && "DeviceOrientationEvent" in window
  );
  const [motionActive, setMotionActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const isFullscreenActive = isFullscreen || isFallbackFullscreen;

  useEffect(() => {
    motionActiveRef.current = motionActive;
  }, [motionActive]);

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
    document.body.style.overflow = isFullscreenActive ? "hidden" : "";

    const timeout = window.setTimeout(() => {
      rendererRef.current?.setSize(
        containerRef.current?.clientWidth ?? 0,
        containerRef.current?.clientHeight ?? 0,
        false
      );
    }, 50);

    return () => {
      window.clearTimeout(timeout);
      document.body.style.overflow = "";
    };
  }, [isFullscreenActive]);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;

    if (!container || !video) {
      return;
    }

    const scene = new THREE.Scene();
    const initialWidth = container.clientWidth;
    const initialHeight = Math.max(container.clientHeight, 1);
    const camera = new THREE.PerspectiveCamera(
      80,
      initialWidth / initialHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const rendererElement = renderer.domElement;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(initialWidth, initialHeight, false);
    rendererRef.current = renderer;
    container.appendChild(rendererElement);

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const euler = new THREE.Euler();
    const zee = new THREE.Vector3(0, 0, 1);
    const q0 = new THREE.Quaternion();
    const q1 = new THREE.Quaternion(-HALF_SQRT, 0, 0, HALF_SQRT);

    const updateCamera = () => {
      if (motionActiveRef.current) {
        camera.quaternion.copy(motionQuaternionRef.current);
        return;
      }

      const phi = THREE.MathUtils.degToRad(90 - latRef.current);
      const theta = THREE.MathUtils.degToRad(lonRef.current);
      const target = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );
      camera.lookAt(target);
    };

    const renderFrame = () => {
      updateCamera();
      renderer.render(scene, camera);
      animationFrameRef.current = window.requestAnimationFrame(renderFrame);
    };

    const handleResize = () => {
      const width = container.clientWidth;
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (motionActiveRef.current) {
        return;
      }

      interactionRef.current = {
        pointerId: event.pointerId,
        clientX: event.clientX,
        clientY: event.clientY,
        lon: lonRef.current,
        lat: latRef.current,
      };
      rendererElement.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (motionActiveRef.current) {
        return;
      }

      const interaction = interactionRef.current;

      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - interaction.clientX;
      const deltaY = event.clientY - interaction.clientY;

      lonRef.current = interaction.lon - deltaX * 0.12;
      latRef.current = THREE.MathUtils.clamp(
        interaction.lat + deltaY * 0.12,
        MIN_LAT,
        MAX_LAT
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (interactionRef.current?.pointerId !== event.pointerId) {
        return;
      }

      interactionRef.current = null;

      if (rendererElement.hasPointerCapture(event.pointerId)) {
        rendererElement.releasePointerCapture(event.pointerId);
      }
    };

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (
        event.alpha === null ||
        event.beta === null ||
        event.gamma === null
      ) {
        return;
      }

      const alpha = THREE.MathUtils.degToRad(event.alpha);
      const beta = THREE.MathUtils.degToRad(event.beta);
      const gamma = THREE.MathUtils.degToRad(event.gamma);
      const screenOrientation =
        window.screen.orientation?.angle ??
        (typeof window.orientation === "number" ? window.orientation : 0);
      const orient = THREE.MathUtils.degToRad(screenOrientation);

      euler.set(beta, alpha, -gamma, "YXZ");
      motionQuaternionRef.current.setFromEuler(euler);
      motionQuaternionRef.current.multiply(q1);
      motionQuaternionRef.current.multiply(q0.setFromAxisAngle(zee, -orient));
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("deviceorientation", handleDeviceOrientation);
    rendererElement.addEventListener("pointerdown", handlePointerDown);
    rendererElement.addEventListener("pointermove", handlePointerMove);
    rendererElement.addEventListener("pointerup", handlePointerUp);
    rendererElement.addEventListener("pointercancel", handlePointerUp);
    rendererElement.style.touchAction = "none";

    animationFrameRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
      rendererElement.removeEventListener("pointerdown", handlePointerDown);
      rendererElement.removeEventListener("pointermove", handlePointerMove);
      rendererElement.removeEventListener("pointerup", handlePointerUp);
      rendererElement.removeEventListener("pointercancel", handlePointerUp);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      interactionRef.current = null;

      video.pause();

      if (video.src) {
        video.removeAttribute("src");
        video.load();
      }

      texture.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      rendererRef.current = null;

      if (rendererElement.parentNode === container) {
        container.removeChild(rendererElement);
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    setIsReady(false);
    setLoadError(null);
    setMotionError(null);
    setIsPlaying(false);
    setIsMuted(true);
    setMotionActive(false);
    video.src = videoUrl;
    video.load();
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.crossOrigin = "anonymous";
    video.setAttribute("webkit-playsinline", "true");

    const handleLoadedData = () => {
      console.log("video readyState", video.readyState);
      setIsReady(true);
      setLoadError(null);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => setIsMuted(video.muted);
    const handleError = () => {
      setLoadError("No se pudo cargar el video 360.");
      setIsReady(false);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("error", handleError);
    void video.play().catch(() => {});

    return () => {
      video.pause();
      if (video.src) {
        video.removeAttribute("src");
        video.load();
      }
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("error", handleError);
    };
  }, [videoUrl]);

  async function togglePlayback() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setLoadError("No se pudo iniciar la reproduccion.");
      }
      return;
    }

    video.pause();
  }

  function toggleMuted() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }

  async function toggleMotion() {
    if (!motionSupported) {
      setMotionError("El movimiento no esta disponible en este dispositivo.");
      return;
    }

    if (motionActive) {
      setMotionActive(false);
      setMotionError(null);
      return;
    }

    const deviceOrientation = DeviceOrientationEvent as
      | DeviceOrientationEventWithPermission
      | undefined;

    if (typeof deviceOrientation?.requestPermission === "function") {
      try {
        const permission = await deviceOrientation.requestPermission();

        if (permission !== "granted") {
          setMotionActive(false);
          setMotionError("Permiso de movimiento denegado.");
          return;
        }
      } catch {
        setMotionActive(false);
        setMotionError("No se pudo activar el movimiento.");
        return;
      }
    }

    setMotionError(null);
    setMotionActive(true);
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
            aria-label={`${title} en video 360`}
            className={`map-paper relative w-full overflow-hidden ${
              isFullscreenActive
                ? "h-screen max-h-none"
                : "aspect-[2/1] max-h-[70vh]"
            }`}
          >
            {!isReady && !loadError ? (
              <div className="absolute inset-0 bg-[#ece8e0]" />
            ) : null}
          </div>

          <video
            ref={videoRef}
            src={videoUrl}
            preload="metadata"
            playsInline
            muted
            loop
            className="hidden"
          />

          <div className="absolute top-3 left-3 flex gap-2">
            <button
              type="button"
              onClick={toggleMotion}
              className="border border-line bg-background/92 px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em] text-foreground transition-opacity hover:opacity-70"
            >
              {motionActive ? "desactivar movimiento" : "activar movimiento"}
            </button>
            <button
              type="button"
              onClick={togglePlayback}
              className="border border-line bg-background/92 px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em] text-foreground transition-opacity hover:opacity-70"
            >
              {isPlaying ? "pausar" : "play"}
            </button>
            <button
              type="button"
              onClick={toggleMuted}
              className="border border-line bg-background/92 px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em] text-foreground transition-opacity hover:opacity-70"
            >
              {isMuted ? "activar audio" : "silenciar"}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 border border-line bg-background/92 px-3 py-2 text-[0.72rem] uppercase tracking-[0.16em] text-foreground transition-opacity hover:opacity-70"
          >
            {isFullscreenActive ? "cerrar" : "fullscreen"}
          </button>

          {loadError || motionError ? (
            <p className="absolute right-3 bottom-3 max-w-[18rem] border border-line bg-background/92 px-3 py-2 text-[0.72rem] leading-relaxed text-muted">
              {loadError ?? motionError}
            </p>
          ) : (
            <p className="absolute right-3 bottom-3 max-w-[18rem] border border-line bg-background/92 px-3 py-2 text-[0.72rem] leading-relaxed text-muted">
              arrastra para explorar 360
            </p>
          )}
        </div>
      </div>
    </figure>
  );
}
