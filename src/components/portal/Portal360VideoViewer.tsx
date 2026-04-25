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
const CONTROL_BUTTON_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-full border border-line bg-background/86 text-[1rem] leading-none text-foreground transition-opacity hover:opacity-70";
const CONTROL_BUTTON_DISABLED_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-full border border-line bg-background/70 text-[1rem] leading-none text-muted";

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function getViewportSize(container: HTMLDivElement, useVisualViewport: boolean) {
  if (useVisualViewport && typeof window !== "undefined") {
    const width = window.visualViewport?.width ?? window.innerWidth;
    const height = window.visualViewport?.height ?? window.innerHeight;

    return {
      width: Math.max(width, 1),
      height: Math.max(height, 1),
    };
  }

  return {
    width: Math.max(container.clientWidth, 1),
    height: Math.max(container.clientHeight, 1),
  };
}

function getCameraProjection(immersive: boolean) {
  if (immersive && typeof window !== "undefined") {
    return {
      aspect: window.innerWidth / Math.max(window.innerHeight, 1),
      fov: 90,
    };
  }

  return {
    aspect: 16 / 9,
    fov: 75,
  };
}

export function Portal360VideoViewer({
  title,
  videoUrl,
}: Portal360VideoViewerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rendererElementRef = useRef<HTMLCanvasElement | null>(null);
  const resizeRendererRef = useRef<(() => void) | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const motionQuaternionRef = useRef(new THREE.Quaternion());
  const motionActiveRef = useRef(false);
  const isMobileLikeRef = useRef(false);
  const isFullscreenActiveRef = useRef(false);
  const isImmersiveMobileRef = useRef(false);
  const isPortraitMobileRef = useRef(false);
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
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [motionSupported] = useState(
    () => typeof window !== "undefined" && "DeviceOrientationEvent" in window
  );
  const [isMobileLike] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.matchMedia("(max-width: 768px)").matches ||
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0
    );
  });
  const [motionActive, setMotionActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const isFullscreenActive = isFullscreen || isFallbackFullscreen;
  const [viewportSize, setViewportSize] = useState(() => {
    if (typeof window === "undefined") {
      return { width: 0, height: 0 };
    }

    return {
      width: window.visualViewport?.width ?? window.innerWidth,
      height: window.visualViewport?.height ?? window.innerHeight,
    };
  });
  const isImmersiveMobile = isMobileLike && hasStartedPlayback;
  const isPortraitMobile =
    isImmersiveMobile && viewportSize.height > viewportSize.width;

  useEffect(() => {
    isMobileLikeRef.current = isMobileLike;
  }, [isMobileLike]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateViewportSize = () => {
      setViewportSize({
        width: window.visualViewport?.width ?? window.innerWidth,
        height: window.visualViewport?.height ?? window.innerHeight,
      });
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);
    window.addEventListener("orientationchange", updateViewportSize);
    window.visualViewport?.addEventListener("resize", updateViewportSize);

    return () => {
      window.removeEventListener("resize", updateViewportSize);
      window.removeEventListener("orientationchange", updateViewportSize);
      window.visualViewport?.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  useEffect(() => {
    isImmersiveMobileRef.current = isImmersiveMobile;
    isPortraitMobileRef.current = isPortraitMobile;
    resizeRendererRef.current?.();

    if (rendererElementRef.current) {
      rendererElementRef.current.style.display = isPortraitMobile ? "none" : "block";
    }
  }, [isImmersiveMobile, isPortraitMobile, viewportSize]);

  useEffect(() => {
    motionActiveRef.current = motionActive;
  }, [motionActive]);

  useEffect(() => {
    isFullscreenActiveRef.current = isFullscreenActive;
  }, [isFullscreenActive]);

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
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow =
      isFullscreenActive || isImmersiveMobile ? "hidden" : previousOverflow;

    const timeout = window.setTimeout(() => {
      resizeRendererRef.current?.();
    }, 50);

    return () => {
      window.clearTimeout(timeout);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreenActive, isImmersiveMobile]);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;

    if (!container || !video) {
      return;
    }

    const scene = new THREE.Scene();
    const initialSize = getViewportSize(
      container,
      isImmersiveMobileRef.current || isFullscreenActiveRef.current
    );
    const initialProjection = getCameraProjection(
      isImmersiveMobileRef.current || isFullscreenActiveRef.current
    );
    const camera = new THREE.PerspectiveCamera(
      initialProjection.fov,
      initialProjection.aspect,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const rendererElement = renderer.domElement;
    rendererElementRef.current = rendererElement;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if ("outputColorSpace" in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.setSize(initialSize.width, initialSize.height, false);
    camera.aspect = initialProjection.aspect;
    camera.fov = initialProjection.fov;
    camera.updateProjectionMatrix();
    rendererRef.current = renderer;
    container.appendChild(rendererElement);
    rendererElement.style.display = isPortraitMobileRef.current ? "none" : "block";

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;

    const geometry = new THREE.SphereGeometry(500, 96, 64);
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
      if (isPortraitMobileRef.current) {
        animationFrameRef.current = window.requestAnimationFrame(renderFrame);
        return;
      }

      updateCamera();
      renderer.render(scene, camera);
      animationFrameRef.current = window.requestAnimationFrame(renderFrame);
    };

    const handleResize = () => {
      const nextSize = getViewportSize(
        container,
        isImmersiveMobileRef.current || isFullscreenActiveRef.current
      );
      const nextProjection = getCameraProjection(
        isImmersiveMobileRef.current || isFullscreenActiveRef.current
      );
      camera.aspect = nextProjection.aspect;
      camera.fov = nextProjection.fov;
      camera.updateProjectionMatrix();
      renderer.setSize(nextSize.width, nextSize.height, false);
    };

    resizeRendererRef.current = handleResize;

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
    window.addEventListener("orientationchange", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("deviceorientation", handleDeviceOrientation);
    rendererElement.addEventListener("pointerdown", handlePointerDown);
    rendererElement.addEventListener("pointermove", handlePointerMove);
    rendererElement.addEventListener("pointerup", handlePointerUp);
    rendererElement.addEventListener("pointercancel", handlePointerUp);
    rendererElement.style.touchAction = "none";

    animationFrameRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
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
      rendererElementRef.current = null;
      resizeRendererRef.current = null;

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
    setHasStartedPlayback(false);
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

  async function requestMotionPermission() {
    if (!motionSupported || isPortraitMobileRef.current) {
      return false;
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
          return false;
        }
      } catch {
        setMotionActive(false);
        setMotionError("No se pudo activar el movimiento.");
        return false;
      }
    }

    setMotionError(null);
    setMotionActive(true);
    return true;
  }

  async function startPlayback(options?: { immersive?: boolean }) {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    try {
      await video.play();
      setHasStartedPlayback(true);
      setLoadError(null);

      if (options?.immersive && isMobileLike) {
        const isPortraitViewport = viewportSize.height > viewportSize.width;

        if (!isPortraitViewport && motionSupported && !motionActive) {
          await requestMotionPermission();
        }
      }
    } catch {
      setLoadError("No se pudo iniciar la reproduccion.");
    }
  }

  async function togglePlayback() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      await startPlayback({ immersive: true });
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
    if (!isMobileLike || !motionSupported || isPortraitMobile) {
      setMotionError("El movimiento no esta disponible en este dispositivo.");
      return;
    }

    if (motionActive) {
      setMotionActive(false);
      setMotionError(null);
      return;
    }

    await requestMotionPermission();
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

  async function closeImmersiveView() {
    const video = videoRef.current;

    if (video) {
      video.pause();
    }

    setMotionActive(false);
    setMotionError(null);
    setHasStartedPlayback(false);

    if (document.fullscreenElement === shellRef.current) {
      await document.exitFullscreen();
      return;
    }

    if (isFallbackFullscreen) {
      setIsFallbackFullscreen(false);
    }
  }

  return (
    <figure className="w-full">
      <div className="mt-0.5 w-full md:mt-1">
        <div
          ref={shellRef}
          className={`relative mx-auto w-full bg-background ${
            isImmersiveMobile || isFullscreenActive
              ? "fixed inset-0 z-[9999] max-w-none overflow-hidden bg-black p-0"
              : "max-w-[1680px]"
          }`}
          style={
            isImmersiveMobile
              ? {
                  width: "100vw",
                  height: "100dvh",
                }
              : undefined
          }
        >
          <div
            ref={containerRef}
            aria-label={`${title} en video 360`}
            className={`map-paper relative w-full overflow-hidden ${
              isImmersiveMobile || isFullscreenActive
                ? "h-full max-h-none bg-black"
                : "aspect-[2/1] max-h-[70vh]"
            }`}
          >
            {!isReady && !loadError && !isImmersiveMobile ? (
              <div className="absolute inset-0 bg-[#ece8e0]" />
            ) : null}

            {isPortraitMobile ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                <p className="text-center text-sm uppercase tracking-[0.2em] text-white">
                  gira tu dispositivo
                </p>
              </div>
            ) : null}

            {!hasStartedPlayback && !loadError ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/28 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={() => void startPlayback({ immersive: true })}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-background/94 text-[1.2rem] leading-none text-foreground transition-opacity hover:opacity-70"
                  aria-label="Iniciar video 360"
                >
                  ▶
                </button>
              </div>
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

          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            {isMobileLike && motionSupported && hasStartedPlayback && !motionActive && !isPortraitMobile ? (
              <button
                type="button"
                onClick={toggleMotion}
                className={CONTROL_BUTTON_CLASS}
                aria-label="Activar movimiento"
              >
                ◎
              </button>
            ) : null}
            <button
              type="button"
              onClick={togglePlayback}
              className={CONTROL_BUTTON_CLASS}
              aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <button
              type="button"
              onClick={toggleMuted}
              className={CONTROL_BUTTON_CLASS}
              aria-label={isMuted ? "Activar audio" : "Silenciar audio"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className={CONTROL_BUTTON_DISABLED_CLASS}
              aria-label="VR pronto"
            >
              🥽
            </button>
          </div>

          <button
            type="button"
            onClick={isImmersiveMobile ? closeImmersiveView : toggleFullscreen}
            className={`absolute top-2 right-2 ${CONTROL_BUTTON_CLASS}`}
            aria-label={
              isImmersiveMobile || isFullscreenActive
                ? "Cerrar visor"
                : "Entrar en fullscreen"
            }
          >
            {isImmersiveMobile || isFullscreenActive ? "✕" : "⛶"}
          </button>

          {loadError || motionError ? (
            <p className="absolute right-2 bottom-2 max-w-[12rem] rounded-[1rem] border border-line bg-background/88 px-2.5 py-2 text-[0.66rem] leading-relaxed text-muted">
              {loadError ?? motionError}
            </p>
          ) : (
            <p className="absolute right-2 bottom-2 max-w-[12rem] rounded-[1rem] border border-line bg-background/88 px-2.5 py-2 text-[0.66rem] leading-relaxed text-muted">
              arrastra para explorar 360
            </p>
          )}
        </div>
      </div>
    </figure>
  );
}
