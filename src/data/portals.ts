import { Portal } from "@/lib/types";

export const portals: Portal[] = [
  {
    id: "p771-01",
    slug: "771-01",
    portalId: "771-01",
    title: "A shutter half-lowered over the corridor of glass.",
    narrative:
      "Morning traffic had already moved on. The storefront reflected a stairwell, a parked bicycle, and a narrow band of pale sky. Nothing happened for several minutes and that became the event.",
    imageUrl: "/images/20220904_182222_preview.jpeg",
    mapId: "mapa-771",
    lat: 19.4323,
    lng: -99.1332,
    markerX: 18,
    markerY: 29,
    audioUrl: "https://example.com/audio/771-01.mp3",
    status: "published",
  },
  {
    id: "p771-02",
    slug: "771-02",
    portalId: "771-02",
    title: "Three windows, one antenna, and the weight of noon.",
    narrative:
      "The facade was almost blank except for an antenna line cutting across the frame. On paper the block looked regular, but standing there made the geometry feel provisional and improvised.",
    imageUrl: "/images/portal-771-02.svg",
    mapId: "mapa-771",
    lat: 19.4329,
    lng: -99.1349,
    markerX: 38,
    markerY: 42,
    audioUrl: "https://example.com/audio/771-02.mp3",
    status: "published",
  },
  {
    id: "p771-03",
    slug: "771-03",
    portalId: "771-03",
    title: "The alley kept a colder air than the avenue beside it.",
    narrative:
      "A service lane narrowed into an accidental room. The concrete wall held marks from posters that had already been removed, leaving a palimpsest more precise than any sign still in place.",
    imageUrl: "/images/portal-771-03.svg",
    mapId: "mapa-771",
    lat: 19.4336,
    lng: -99.1318,
    markerX: 56,
    markerY: 58,
    audioUrl: "https://example.com/audio/771-03.mp3",
    status: "published",
  },
  {
    id: "p771-04",
    slug: "771-04",
    portalId: "771-04",
    title: "A pedestrian bridge crossing above a field of cables.",
    narrative:
      "The bridge was functional and strangely ceremonial. Crossing it slowed the body just enough to notice the rooflines stitched together below.",
    imageUrl: "/images/portal-771-04.svg",
    mapId: "mapa-771",
    lat: 19.4342,
    lng: -99.1358,
    markerX: 74,
    markerY: 36,
    audioUrl: "https://example.com/audio/771-04.mp3",
    status: "published",
  },
  {
    id: "p771-05",
    slug: "771-05",
    portalId: "771-05",
    title: "A stair tower indexed but not yet opened to the public map.",
    narrative:
      "Concrete dust stayed on the handrail for weeks. The stair tower looked complete from the avenue, but every landing still carried tape, chalk marks, and unfinished edges.",
    imageUrl: "/images/portal-771-05.svg",
    mapId: "mapa-771",
    lat: 19.4318,
    lng: -99.1321,
    markerX: 83,
    markerY: 67,
    audioUrl: "https://example.com/audio/771-05.mp3",
    status: "draft",
  },
];

export function getPublishedPortals() {
  return portals.filter((portal) => portal.status === "published");
}

export function getPortalById(id: string) {
  return portals.find((portal) => portal.id === id);
}
