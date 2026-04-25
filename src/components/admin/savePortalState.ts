export type SavePortalState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialSavePortalState: SavePortalState = {
  status: "idle",
  message: "",
};
