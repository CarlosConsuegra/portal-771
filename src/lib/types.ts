export type MapRecord = {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
};

export type PortalStatus = "draft" | "published";

export type Portal = {
  id: string;
  slug: string;
  portalId: string;
  title: string;
  narrative: string;
  imageUrl: string;
  imageUrl360?: string | null;
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
  audio_url: string | null;
  status: string;
  created_at: string;
};
