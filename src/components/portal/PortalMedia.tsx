"use client";

import dynamic from "next/dynamic";
import { PortalImage } from "./PortalImage";

type PortalMediaProps = {
  title: string;
  imageUrl: string;
  imageUrl360?: string | null;
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

export function PortalMedia({
  title,
  imageUrl,
  imageUrl360,
}: PortalMediaProps) {
  if (!imageUrl360) {
    return <PortalImage title={title} imageUrl={imageUrl} />;
  }

  return <Portal360Viewer title={title} panoramaUrl={imageUrl360} />;
}
