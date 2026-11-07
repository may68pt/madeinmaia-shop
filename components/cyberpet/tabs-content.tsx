"use client";

import type { ComponentType } from "react";
import { TuningTab } from "./tab-tuning";
import { GamesTab } from "./tab-games";
import { ItemsTab } from "./tab-items";
import { ReleasesTab } from "./tab-releases";

/* Back-office tabs for content and live tuning. Each later block adds its tab here. */
export const CONTENT_TABS: [string, string, ComponentType][] = [
  ["items", "Rare items", ItemsTab],
  ["releases", "Releases", ReleasesTab],
  ["games", "Games", GamesTab],
  ["tuning", "Tuning", TuningTab],
];
