import type { FontFamily, TitleMode } from "../../types";
import { usePlatformAppearance, usePlatformLanguage } from "../platform/platformContexts";

/** Diagram title: text, font and size. */
export default function TitleSection() {
  const { t } = usePlatformLanguage();
  const {
    customTitle,
    setCustomTitle,
    setTitleFont,
    setTitleMode,
    setTitleSize,
    titleFont,
    titleMode,
    titleSize,
  } = usePlatformAppearance();
  return (
    <>
      <label>
        {t("ui.title")}
        <select
          value={titleMode}
          onChange={(event) => setTitleMode(event.target.value as TitleMode)}
        >
          <option value="auto">{t("ui.autoInstrumentLayout")}</option>
          <option value="contextual">{t("ui.contextualToolAndSelection")}</option>
          <option value="custom">{t("ui.custom")}</option>
          <option value="none">{t("common.none")}</option>
        </select>
      </label>

      {titleMode === "custom" && (
        <label>
          {t("ui.customTitle")}
          <input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} />
        </label>
      )}

      {titleMode !== "none" && (
        <>
          <label>
            {t("ui.titleFont")}
            <select
              value={titleFont}
              onChange={(event) => setTitleFont(event.target.value as FontFamily)}
            >
              <option value="system">{t("ui.system")}</option>
              <option value="serif">{t("ui.serif")}</option>
              <option value="mono">{t("ui.mono")}</option>
              <option value="rounded">{t("ui.rounded")}</option>
            </select>
          </label>

          <label>
            {t("ui.titleSize")} {titleSize}px
            <input
              type="range"
              min={14}
              max={42}
              value={titleSize}
              onChange={(event) => setTitleSize(Number(event.target.value))}
            />
          </label>
        </>
      )}
    </>
  );
}
