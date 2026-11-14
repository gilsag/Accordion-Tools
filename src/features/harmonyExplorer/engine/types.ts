import type { ChordCandidate, ChordFamilyId } from "./music";

export type HarmonyPlaybackStyle = "block" | "arpeggio";
export type HarmonyVoicingStyle = "root" | "smooth";

export type HarmonySelection = {
  sectorIndex: number;
  sharedCount: number;
  referenceRootPc: number;
  referenceFamilyId: ChordFamilyId;
  candidate: ChordCandidate;
};
