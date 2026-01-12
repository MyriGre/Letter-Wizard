// AI-AGENT-HEADER
// path: /src/lib/cn.ts
// summary: Utility to combine class names with tailwind-merge and clsx.
// last-reviewed: 2025-12-08
// line-range: 1-40

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

