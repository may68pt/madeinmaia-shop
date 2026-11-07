"use client";

import type { ComponentType } from "react";
import { TuningTab } from "./tab-tuning";

/* Back-office tabs for content and live tuning. Each later block adds its tab here. */
export const CONTENT_TABS: [string, string, ComponentType][] = [
  ["tuning", "Tuning", TuningTab],
];
