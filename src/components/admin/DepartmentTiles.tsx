"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface DepartmentTile {
  label: string;
  icon: LucideIcon;
  href?: string;
}

interface DepartmentTilesProps {
  tiles: DepartmentTile[];
}

export default function DepartmentTiles({ tiles }: DepartmentTilesProps) {
  return (
    <div className="flex flex-wrap justify-center gap-10">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const content = (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-100 bg-white text-blue-600 shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-center text-sm font-medium text-slate-700">{tile.label}</span>
          </>
        );

        if (tile.href) {
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="flex w-24 flex-col items-center gap-2.5 transition-transform hover:-translate-y-0.5"
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={tile.label} className="flex w-24 flex-col items-center gap-2.5">
            {content}
          </div>
        );
      })}
    </div>
  );
}
