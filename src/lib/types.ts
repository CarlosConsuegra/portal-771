export type MapRecord = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  description?: string;
  createdAt?: string;
};

export type PortalStatus = "draft" | "published";
export type PortalMediaType =
  | "image_2d"
  | "image_360"
  | "youtube_360"
  | "video_360";

export type Portal = {
  id: string;
  slug: string;
  portalId: string;
  title: string;
  narrative: string;
  imageUrl: string;
  imageUrl360?: string | null;
  video360Url?: string | null;
  mediaType: PortalMediaType;
  youtubeVideoId?: string | null;
  mapId: string;
  lat: number | null;
  lng: number | null;
  markerX: number;
  markerY: number;
  audioUrl?: string | null;
  status: PortalStatus | string;
  createdAt?: string;
};

export type PortalRow = {
  id: string;
  slug: string;
  titulo: string;
  narrativa: string;
  mapa_id: string;
  marker_x: number;
  marker_y: number;
  lat: number | null;
  lng: number | null;
  image_url: string;
  image_360_url?: string | null;
  video_360_url?: string | null;
  media_type?: PortalMediaType | null;
  youtube_video_id?: string | null;
  audio_url: string | null;
  status: string;
  created_at: string;
};

export type MapRow = {
  id: string;
  slug: string;
  titulo: string;
  image_url: string;
  created_at: string;
};
