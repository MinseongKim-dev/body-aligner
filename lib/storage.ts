'use client';

import type { AppState } from './types';

const KEY = 'bodyalign_state';

export const DEFAULT_STATE: AppState = {
  checklistAnswers: {},
  painLocations: [],
  detectedPatterns: [],
  photoAnalysis: null,
  videoAnalyses: [],
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: Partial<AppState>): void {
  if (typeof window === 'undefined') return;
  const current = loadState();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...state }));
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
