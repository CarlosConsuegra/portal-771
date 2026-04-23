"use client";

import { useRef, useState } from "react";

type PortalNarrativeProps = {
  narrative: string;
  audioUrl?: string | null;
};

export function PortalNarrative({
  narrative,
  audioUrl,
}: PortalNarrativeProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  async function toggleAudio() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-3 text-center md:max-w-[42rem] md:px-0">
      {audioUrl ? (
        <>
          <button
            type="button"
            onClick={toggleAudio}
            className="mb-2 inline-flex items-center gap-1.5 px-3 py-2 text-sm text-muted transition-opacity hover:opacity-70 sm:text-xs md:text-[0.72rem]"
            aria-label={isPlaying ? "Pausar audio" : "Reproducir audio"}
          >
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-muted"
            />
            <span>audio</span>
          </button>
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="none"
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
        </>
      ) : null}
      <p className="text-base leading-[2.05] font-normal text-[#262626] sm:text-lg md:text-[1rem]">
        {narrative}
      </p>
    </div>
  );
}
