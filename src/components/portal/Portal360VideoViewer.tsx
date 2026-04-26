"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";

type Portal360VideoViewerProps = {
  title: string;
  videoUrl: string;
};

type MobileExperienceStage = "prestart" | "normal";

const MIN_LAT = -85;
const MAX_LAT = 85;
const HALF_SQRT = Math.sqrt(0.5);
const DESKTOP_TEXT_BUTTON_CLASS =
  "border border-line bg-background/92 px-3 py-2 text-[0.68rem] uppercase tracking-[0.18em] text-foreground transition-opacity hover:opacity-70";
const MOBILE_TEXT_BUTTON_CLASS =
  "border border-white/70 bg-black/28 px-3 py-2 text-[0.68rem] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-70";

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

function getNarrativeText(fallback: string) {
  if (typeof document === "undefined") {
    return fallback;
  }

  const paragraphs = Array.from(document.querySelectorAll("main p"))
    .map((element) => element.textContent?.trim() ?? "")
    .filter(Boolean);

  return paragraphs.sort((left, right) => right.length - left.length)[0] ?? fallback;
}

function getNarrativeAudioElement() {
  if (typeof document === "undefined") {
    return null;
  }

  const audio = document.querySelector("main audio");
  return audio instanceof HTMLAudioElement ? audio : null;
}

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

function getCameraProjection(immersive: boolean, width: number, height: number) {
  if (immersive) {
    return {
      aspect: width / Math.max(height, 1),
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
  const narrativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const motionQuaternionRef = useRef(new THREE.Quaternion());
  const motionActiveRef = useRef(false);
  const isFullscreenActiveRef = useRef(false);
  const isExperienceModeRef = useRef(false);
  const mobileStageRef = useRef<MobileExperienceStage>("prestart");
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
  const [isNarrativePlaying, setIsNarrativePlaying] = useState(false);
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
  const [isExperienceMode, setIsExperienceMode] = useState(isMobileLike);
  const [mobileStage, setMobileStage] =
    useState<MobileExperienceStage>("prestart");
  const [viewportSize, setViewportSize] = useState(() => {
    if (typeof window === "undefined") {
      return { width: 0, height: 0 };
    }

    return {
      width: window.visualViewport?.width ?? window.innerWidth,
      height: window.visualViewport?.height ?? window.innerHeight,
    };
  });

  const isMobileExperience = isMobileLike && isExperienceMode;
  const isPortraitMobile =
    isMobileExperience && viewportSize.height > viewportSize.width;
  const isMobileNormalMode = isMobileExperience && mobileStage === "normal";
  const containerMode = isMobileExperience ? "mobile" : "embed";
  const narrativeText = getNarrativeText(title);
  const narrativeAudioElement = getNarrativeAudioElement();
  const hasNarrativeAudio = Boolean(narrativeAudioElement?.getAttribute("src"));

  useEffect(() => {
    if (!narrativeAudioElement) {
      narrativeAudioRef.current = null;
      queueMicrotask(() => setIsNarrativePlaying(false));
      return;
    }

    narrativeAudioRef.current = narrativeAudioElement;

    const syncNarrativeState = () => {
      setIsNarrativePlaying(!narrativeAudioElement.paused);
    };

    narrativeAudioElement.addEventListener("play", syncNarrativeState);
    narrativeAudioElement.addEventListener("pause", syncNarrativeState);
    narrativeAudioElement.addEventListener("ended", syncNarrativeState);
    queueMicrotask(syncNarrativeState);

    return () => {
      narrativeAudioElement.removeEventListener("play", syncNarrativeState);
      narrativeAudioElement.removeEventListener("pause", syncNarrativeState);
      narrativeAudioElement.removeEventListener("ended", syncNarrativeState);
    };
  }, [narrativeAudioElement]);

  useEffect(() => {
    motionActiveRef.current = motionActive;
  }, [motionActive]);

  useEffect(() => {
    isFullscreenActiveRef.current = isFullscreenActive;
  }, [isFullscreenActive]);

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
    isExperienceModeRef.current = isMobileExperience;
    mobileStageRef.current = mobileStage;
    isPortraitMobileRef.current = isPortraitMobile;
    resizeRendererRef.current?.();

    if (rendererElementRef.current) {
      rendererElementRef.current.style.display =
        isPortraitMobile || (isMobileExperience && mobileStage !== "normal")
          ? "none"
          : "block";
    }
  }, [isMobileExperience, mobileStage, isPortraitMobile, viewportSize]);

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
      isFullscreenActive || isMobileExperience ? "hidden" : previousOverflow;

    const timeout = window.setTimeout(() => {
      resizeRendererRef.current?.();
    }, 50);

    return () => {
      window.clearTimeout(timeout);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreenActive, isMobileExperience]);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;

    if (!container || !video) {
      return;
    }

    const scene = new THREE.Scene();
    const initialSize = getViewportSize(
      container,
      isExperienceModeRef.current || isFullscreenActiveRef.current
    );
    const initialProjection = getCameraProjection(
      isExperienceModeRef.current || isFullscreenActiveRef.current,
      initialSize.width,
      initialSize.height
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
    rendererElement.style.display =
      isPortraitMobileRef.current ||
      (isExperienceModeRef.current && mobileStageRef.current !== "normal")
        ? "none"
        : "block";

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
      if (
        isPortraitMobileRef.current ||
        (isExperienceModeRef.current && mobileStageRef.current !== "normal")
      ) {
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
        isExperienceModeRef.current || isFullscreenActiveRef.current
      );
      const nextProjection = getCameraProjection(
        isExperienceModeRef.current || isFullscreenActiveRef.current,
        nextSize.width,
        nextSize.height
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
  }, [videoUrl, containerMode]);

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
    setIsExperienceMode(isMobileLike);
    setMobileStage("prestart");
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
  }, [videoUrl, isMobileLike]);

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

    if (options?.immersive && isMobileLike) {
      const isPortraitViewport = viewportSize.height > viewportSize.width;

      video.muted = false;
      setIsMuted(false);

      if (!isPortraitViewport && motionSupported && !motionActive) {
        await requestMotionPermission();
      }
    }

    try {
      await video.play();
      setHasStartedPlayback(true);
      setLoadError(null);

      if (options?.immersive && isMobileLike) {
        setMobileStage("normal");
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
      if (isMobileNormalMode) {
        try {
          await video.play();
          setLoadError(null);
        } catch {
          setLoadError("No se pudo iniciar la reproduccion.");
        }
        return;
      }

      if (isMobileLike) {
        setIsExperienceMode(true);
        return;
      }

      await startPlayback({ immersive: false });
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

  async function handleBackToMap() {
    const video = videoRef.current;
    const narrativeAudio = narrativeAudioRef.current;

    if (video) {
      video.pause();
    }

    if (narrativeAudio) {
      narrativeAudio.pause();
    }

    setMotionActive(false);
    setMotionError(null);
    setHasStartedPlayback(false);
    setMobileStage("prestart");
    setIsExperienceMode(false);
    document.body.style.overflow = "";

    const searchParams = new URLSearchParams(window.location.search);
    const mapId = searchParams.get("map");
    const target = mapId ? `/?map=${encodeURIComponent(mapId)}` : "/";
    window.location.assign(target);
  }

  async function toggleNarrativeAudio() {
    const narrativeAudio = narrativeAudioRef.current;

    if (!narrativeAudio) {
      return;
    }

    if (narrativeAudio.paused) {
      try {
        await narrativeAudio.play();
      } catch {
        // Keep the overlay usable even if playback fails.
      }
      return;
    }

    narrativeAudio.pause();
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

  const embeddedViewer = (
    <div
      ref={shellRef}
      className={`relative mx-auto w-full bg-background ${
        isFullscreenActive ? "fixed inset-0 z-[9999] max-w-none overflow-hidden bg-black p-0" : "max-w-[1680px]"
      }`}
    >
      <div
        ref={containerRef}
        aria-label={`${title} en video 360`}
        className={`map-paper relative w-full overflow-hidden ${
          isFullscreenActive ? "h-full max-h-none bg-black" : "aspect-[2/1] max-h-[70vh]"
        }`}
      >
        {!isReady && !loadError ? (
          <div className="absolute inset-0 bg-[#ece8e0]" />
        ) : null}

        {!hasStartedPlayback && !loadError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/28 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => void startPlayback({ immersive: false })}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-background/94 text-[1.2rem] leading-none text-foreground transition-opacity hover:opacity-70"
              aria-label="Iniciar video 360"
            >
              ▶
            </button>
          </div>
        ) : null}
      </div>

      <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={togglePlayback}
          className={DESKTOP_TEXT_BUTTON_CLASS}
          aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
        >
          {isPlaying ? "PAUSA" : "PLAY"}
        </button>
        <button
          type="button"
          onClick={toggleMuted}
          className={DESKTOP_TEXT_BUTTON_CLASS}
          aria-label={isMuted ? "Activar audio" : "Silenciar audio"}
        >
          {isMuted ? "AUDIO" : "SILENCIAR"}
        </button>
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        className={`absolute top-2 right-2 ${DESKTOP_TEXT_BUTTON_CLASS}`}
        aria-label={isFullscreenActive ? "Cerrar visor" : "Entrar en fullscreen"}
      >
        {isFullscreenActive ? "CERRAR" : "FULLSCREEN"}
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
  );

  const mobileOverlay =
    isMobileExperience && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[99999] overflow-hidden bg-black"
            style={{ width: "100vw", height: "100dvh" }}
          >
            <div
              ref={containerRef}
              aria-label={`${title} en video 360`}
              className="relative h-full w-full overflow-hidden bg-black"
            >
              {isPortraitMobile ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                  <p className="text-center text-sm uppercase tracking-[0.2em] text-white">
                    gira tu dispositivo
                  </p>
                </div>
              ) : null}

              {!isPortraitMobile && mobileStage === "prestart" ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                  <button
                    type="button"
                    onClick={() => void startPlayback({ immersive: true })}
                    className="rounded-full border border-white/30 bg-white/8 px-6 py-3 text-sm uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-70"
                    style={{ color: "#ffffff" }}
                  >
                    Iniciar
                  </button>
                </div>
              ) : null}
            </div>

            {isMobileNormalMode ? (
              <div className="absolute top-2 left-2 flex max-w-[calc(100vw-5rem)] flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleBackToMap}
                  className={MOBILE_TEXT_BUTTON_CLASS}
                >
                  VOLVER
                </button>
                <button
                  type="button"
                  onClick={togglePlayback}
                  className={MOBILE_TEXT_BUTTON_CLASS}
                  aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
                >
                  {isPlaying ? "PAUSA" : "PLAY"}
                </button>
                <button
                  type="button"
                  onClick={toggleMuted}
                  className={MOBILE_TEXT_BUTTON_CLASS}
                  aria-label={isMuted ? "Activar audio" : "Silenciar audio"}
                >
                  {isMuted ? "AUDIO" : "SILENCIAR"}
                </button>
                {hasNarrativeAudio ? (
                  <button
                    type="button"
                    onClick={toggleNarrativeAudio}
                    className={MOBILE_TEXT_BUTTON_CLASS}
                  >
                    {isNarrativePlaying ? "PAUSAR" : "NARRATIVA"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {loadError || motionError ? (
              <p className="absolute right-2 bottom-2 max-w-[12rem] rounded-[1rem] border border-white/35 bg-black/55 px-3 py-2 text-[0.68rem] leading-relaxed text-white">
                {loadError ?? motionError}
              </p>
            ) : isMobileNormalMode ? (
              <p className="absolute bottom-3 left-1/2 line-clamp-3 w-[72vw] max-w-[72vw] -translate-x-1/2 border border-white/35 bg-black/55 px-3 py-2 text-center text-[0.68rem] leading-relaxed text-white">
                {narrativeText}
              </p>
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <figure className="w-full">
      <div className="mt-0.5 w-full md:mt-1">
        {embeddedViewer}
        <video
          ref={videoRef}
          src={videoUrl}
          preload="metadata"
          playsInline
          muted
          loop
          className="hidden"
        />
        {mobileOverlay}
      </div>
    </figure>
  );
}
