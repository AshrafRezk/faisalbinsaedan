import { create } from "zustand";
import { readCachedFeatureSwitchesSync } from "../featureSwitches";

interface FeatureSwitchState {
  values: Record<string, boolean>;
  fields: any[];
  isReady: boolean;
  setFeatures: (values: Record<string, boolean>, fields?: any[]) => void;
  getFeature: (apiName: string, defaultValue?: boolean) => boolean;
}

function normalizeValues(values: Record<string, boolean>) {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k.toLowerCase(), v]));
}

const cached = readCachedFeatureSwitchesSync();

export const useFeatureSwitchStore = create<FeatureSwitchState>((set, get) => ({
  values: cached ? normalizeValues(cached.values) : {},
  fields: cached?.fields ?? [],
  isReady: true,
  setFeatures: (values, fields = []) => {
    set({ values: normalizeValues(values), fields, isReady: true });
  },
  getFeature: (apiName, defaultValue = false) => {
    const state = get();
    const key = apiName.toLowerCase();
    if (key in state.values) {
      return state.values[key];
    }
    return defaultValue;
  },
}));
