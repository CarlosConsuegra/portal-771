"use client";

import dynamic from "next/dynamic";
import { PortalMediaType } from "@/lib/types";
import { PortalImage } from "./PortalImage";

type PortalMediaProps = {
  title: string;
  imageUrl: string;
  imageUrl360?: string | null;
  video360Url?: string | null;
  mediaType: PortalMediaType;
  youtubeVideoId?: string | null;
};

const Portal360Viewer = dynamic(
  () => import("./Portal360Viewer").then((mod) => mod.Portal360Viewer),
  {
    ssr: false,
    loading: () => (
      <div className="mt-0.5 w-full md:mt-1">
        <div className="mx-auto h-[60vh] max-h-[70vh] w-full max-w-[1680px] border border-line bg-[#ece8e0]" />
      </div>
    ),
  }
);

const Portal360VideoViewer = dynamic(
  () =>
    import("./Portal360VideoViewer").then((mod) => mod.Portal360VideoViewer),
  {
    ssr: false,
    loading: () => (
      <div className="mt-0.5 w-full md:mt-1">
        <div className="mx-auto h-[60vh] max-h-[70vh] w-full max-w-[1680px] border border-line bg-[#ece8e0]" />
      </div>
    ),
  }
);

export function PortalMedia({
  title,
  imageUrl,
  imageUrl360,
  video360Url,
  mediaType,
  youtubeVideoId,
}: PortalMediaProps) {
  if (mediaType === "youtube_360" && youtubeVideoId) {
    return (
      <figure className="w-full">
        <div className="mt-0.5 w-full md:mt-1">
          <div className="relative mx-auto aspect-video w-full max-w-[1680px] overflow-hidden border border-line bg-[#ece8e0] md:w-[93vw]">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1&playsinline=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
      </figure>
    );
  }

  if (mediaType === "video_360" && video360Url) {
    return <Portal360VideoViewer title={title} videoUrl={video360Url} />;
  }

  if (mediaType !== "image_360" || !imageUrl360) {
    return <PortalImage title={title} imageUrl={imageUrl} />;
  }

  return <Portal360Viewer title={title} panoramaUrl={imageUrl360} />;
}
