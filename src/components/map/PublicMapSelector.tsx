"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MapRecord } from "@/lib/types";

type PublicMapSelectorProps = {
  maps: MapRecord[];
  value: string;
};

export function PublicMapSelector({ maps, value }: PublicMapSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-3 text-sm text-muted">
      <span className="text-xs uppercase tracking-[0.18em]">mapa</span>
      <select
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("map", event.currentTarget.value);
          router.push(`/?${params.toString()}`);
        }}
        className="min-h-10 border border-line bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-technical"
      >
        {maps.map((map) => (
          <option key={map.id} value={map.id}>
            {map.name}
          </option>
        ))}
      </select>
    </label>
  );
}
