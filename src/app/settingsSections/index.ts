import type { ComponentType } from "react";
import type { TranslationKey } from "../../i18n/catalog";
import type { AppControllerModel } from "../useAppController";
import type { SettingsSection } from "../useWorkspaceNavigation";
import AboutSection from "./AboutSection";
import AccordionAppearanceSection from "./AccordionAppearanceSection";
import HarmonyAppearanceSection from "./HarmonyAppearanceSection";
import HarmonySection from "./HarmonySection";
import InstrumentSection from "./InstrumentSection";
import MusicNotationSection from "./MusicNotationSection";
import NotationSection from "./NotationSection";
import SoundSection from "./SoundSection";
import TitleSection from "./TitleSection";

type SettingsSectionDefinition = {
  id: NonNullable<SettingsSection>;
  titleKey: TranslationKey;
  /** The workspaces in which the section is listed. */
  workspace: "accordion" | "harmony" | "both";
  /** Optional hint shown above the section. */
  introKey?: TranslationKey;
  Component: ComponentType<{ model: AppControllerModel["settings"] }>;
};

/** The Settings panel, top to bottom. Each section declares, as a `Pick` of
 * the controller model, exactly the fields it reads. "Appearance" has one
 * component per workspace because the two share a name but no controls.
 */
export const SETTINGS_SECTIONS: readonly SettingsSectionDefinition[] = [
  { id: "instrument", titleKey: "settings.instrument", workspace: "accordion", Component: InstrumentSection },
  { id: "notation", titleKey: "settings.notation", workspace: "accordion", Component: NotationSection },
  { id: "musicNotation", titleKey: "settings.musicNotation", workspace: "both", Component: MusicNotationSection },
  { id: "appearance", titleKey: "settings.appearance", workspace: "accordion", Component: AccordionAppearanceSection },
  { id: "appearance", titleKey: "settings.appearance", workspace: "harmony", Component: HarmonyAppearanceSection },
  { id: "sound", titleKey: "settings.sound", workspace: "both", Component: SoundSection },
  { id: "title", titleKey: "settings.title", workspace: "accordion", Component: TitleSection },
  { id: "harmony", titleKey: "nav.harmony", workspace: "harmony", introKey: "settings.harmonyIntro", Component: HarmonySection },
  { id: "about", titleKey: "about.title", workspace: "both", Component: AboutSection },
];
