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
    <div className="mx-auto flex w-full max-w-[42rem] flex-col items-center px-3 text-center md:px-0">
      {audioUrl ? (
        <>
          <button
            type="button"
            onClick={toggleAudio}
            className="mb-2 inline-flex items-center gap-1.5 text-[0.72rem] text-muted transition-opacity hover:opacity-70"
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
      <p className="text-[1rem] leading-[2.05] font-normal text-[#262626]">
        {narrative}
      </p>
    </div>
  );
}
