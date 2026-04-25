const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function extractEmbedSrc(value: string) {
  const iframeMatch = value.match(/src=(['"])(.*?)\1/i);
  return iframeMatch?.[2] ?? value;
}

export function extractYouTubeVideoId(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const candidate = extractEmbedSrc(trimmed);

  if (YOUTUBE_ID_PATTERN.test(candidate)) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = url.searchParams.get("v");
      if (watchId && YOUTUBE_ID_PATTERN.test(watchId)) {
        return watchId;
      }

      const segments = url.pathname.split("/").filter(Boolean);
      const embedIndex = segments.findIndex((segment) => segment === "embed");
      if (embedIndex >= 0) {
        const embedId = segments[embedIndex + 1] ?? "";
        return YOUTUBE_ID_PATTERN.test(embedId) ? embedId : null;
      }
    }
  } catch {
    const embedMatch = candidate.match(
      /(?:youtube\.com\/embed\/|youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/
    );
    if (embedMatch) {
      return embedMatch[1];
    }
  }

  return null;
}
