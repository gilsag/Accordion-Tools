import { translate, type InterfaceLanguage } from "../../i18n/catalog";
/* Harmonic-circle descriptive text. Distinguish a ring hidden by display
   settings from one absent because no chord survived the diatonic filter. */

export type DiagramExplanationInput = {
  referenceFamilyName: string;
  relatedFamilyName: string;
  scaleName: string;
  diatonicOnly: boolean;
  highlightDiatonic: boolean;
  allFamiliesMode: boolean;
  counts: readonly number[];
  availableCounts: readonly number[];
  allCounts: readonly number[];
  language?: InterfaceLanguage;
};

function listNumbers(values: readonly number[], language: InterfaceLanguage = "en") {
  const conjunction: Record<InterfaceLanguage, string> = {
    en: "and", es: "y", fr: "et", pt: "e", it: "e", de: "und",
  };
  const word = conjunction[language];
  if (values.length === 1) return String(values[0]);
  if (values.length === 2) return `${values[0]} ${word} ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}${language === "en" ? "," : ""} ${word} ${values.at(-1)}`;
}

function ringPhrase(values: readonly number[], language: InterfaceLanguage = "en") {
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(language, key, params);
  if (language !== "en") {
    return values.length === 1 ? t("analysis.harmonyRingOne", { count: values[0], unit: values[0] === 1 ? t("analysis.noteSingular") : t("analysis.notePlural") })
      : t("analysis.harmonyRingMany", { counts: listNumbers(values, language) });
  }
  if (values.length === 1) {
    const count = values[0];
    return `The ${count}-shared-${count === 1 ? "note" : "notes"} ring is hidden by the display settings.`;
  }
  return `The rings for ${listNumbers(values)} shared notes are hidden by the display settings.`;
}

export function buildDiagramExplanation({
  referenceFamilyName,
  relatedFamilyName,
  scaleName,
  diatonicOnly,
  highlightDiatonic,
  allFamiliesMode,
  counts,
  availableCounts,
  allCounts,
  language = "en",
}: DiagramExplanationInput) {
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate(language, key, params);
  if (language !== "en") {
    const parts = [t(allFamiliesMode ? "analysis.harmonyAll" : "analysis.harmonyInner", { reference: referenceFamilyName.toLowerCase(), related: relatedFamilyName.toLowerCase() })];
    const hidden = availableCounts.filter((count) => !counts.includes(count));
    if (allFamiliesMode) {
      parts.push(t("analysis.harmonyAllDiatonic", { scale: scaleName }));
      parts.push(t(availableCounts.length ? "analysis.harmonyOnlyAvailable" : "analysis.harmonyNoSupported"));
    } else if (diatonicOnly) {
      parts.push(t("analysis.harmonyOnlyDiatonic", { scale: scaleName }));
      const filtered = allCounts.filter((count) => !availableCounts.includes(count));
      if (!availableCounts.length && allCounts.length) parts.push(t("analysis.harmonyNoDiatonic"));
      else if (filtered.length === 1) parts.push(t("analysis.harmonyFilteredOne", { count: filtered[0], unit: filtered[0] === 1 ? t("analysis.noteSingular") : t("analysis.notePlural") }));
      else if (filtered.length > 1) parts.push(t("analysis.harmonyFilteredMany", { counts: listNumbers(filtered, language) }));
    } else parts.push(t(highlightDiatonic ? "analysis.harmonyHighlight" : "analysis.harmonyWithoutHighlight", { scale: scaleName }));
    if (hidden.length) parts.push(ringPhrase(hidden, language));
    return parts.join(" ");
  }
  const parts = [
    allFamiliesMode
      ? `The inner ring shows ${referenceFamilyName.toLowerCase()} chords. Outer rings combine all supported chord families, with more shared pitch classes placed closer to the center.`
      : `The inner ring shows ${referenceFamilyName.toLowerCase()} chords. Outer rings show ${relatedFamilyName.toLowerCase()} chords, with more shared pitch classes placed closer to the center.`,
  ];

  const hiddenCounts = availableCounts.filter((count) => !counts.includes(count));

  if (allFamiliesMode) {
    parts.push(`All-families diagrams are intentionally limited to chords diatonic to ${scaleName}, transposed to each sector root, to keep the visualization readable.`);
    if (availableCounts.length === 0) {
      parts.push(`No supported diatonic chord satisfies the current relationship settings, so no relationship rings are available.`);
    } else {
      parts.push(`Only shared-note counts represented by at least one diatonic chord are available as rings.`);
      if (hiddenCounts.length > 0) parts.push(ringPhrase(hiddenCounts));
    }
    return parts.join(" ");
  }

  if (diatonicOnly) {
    parts.push(`Only chords diatonic to ${scaleName}, transposed to each sector root, are included.`);
    const filteredOutCounts = allCounts.filter((count) => !availableCounts.includes(count));
    if (availableCounts.length === 0 && allCounts.length > 0) {
      parts.push(`No related chords satisfy the diatonic filter, so no relationship rings are available.`);
    } else if (filteredOutCounts.length === 1) {
      const count = filteredOutCounts[0];
      parts.push(`The ring for chords sharing ${count} ${count === 1 ? "note" : "notes"} is unavailable because no diatonic chord has that overlap.`);
    } else if (filteredOutCounts.length > 1) {
      parts.push(`Rings for chords sharing ${listNumbers(filteredOutCounts)} notes are unavailable because no diatonic chords have those overlaps.`);
    }
  } else if (highlightDiatonic) {
    parts.push(`All qualifying chords are available; labels in blue are diatonic to ${scaleName} in their sector.`);
  } else {
    parts.push(`All qualifying chords are available, without distinguishing diatonic relationships.`);
  }

  if (hiddenCounts.length > 0) parts.push(ringPhrase(hiddenCounts));

  return parts.join(" ");
}
