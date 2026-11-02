
import { stradellaDiagramRowLabel } from "../../i18n/musicTerms";
import { harmonyRelatedDisplayName, harmonyStatusText } from "../../i18n/diagramLabels";
import { WorkspaceToolbar } from "../../app/components/WorkspaceToolbar";
import { DiagramButtonLayer } from "../../diagram/components/DiagramButtonLayer";
import { DiagramConnections } from "../../diagram/components/DiagramConnections";
import { DiagramAnnotationsLayer } from "../../diagram/components/DiagramAnnotationsLayer";
import { DiagramSvgSurface } from "../../diagram/components/DiagramSvgSurface";
import { downloadRenderedNotationSvg } from "../../notation/notationService";
import type { CSSProperties } from "react";
import { bassPatternName, progressionName } from "../../i18n/optionLabels";
import { fontClass } from "../../music";
import { stradellaRowLabel } from "../../stradella";
import { stopAllSound } from "../../sound";
import { StradellaVoicingIntervals } from "../../components/tools/StradellaVoicingIntervals";
import { SegmentedChoice } from "../../components/ui/SegmentedChoice";
import { HarmonicCircle } from "../../tools/harmonyExplorer/components/HarmonicCircle";
import type { AppControllerModel } from "../useAppController";

/** View-only component: all state and commands originate in the controller. */
export function WorkspaceView({model}:{model:AppControllerModel["workspace"]}) {
  const {
    abcActiveButtonIdSet, abcNotationRef, abcParseResult, abcRenderedNotationVisible, abcText, accidentalStyle,
    activeToolSection, annotationButtonAnchor, annotationEditorRef, annotationLevelForLine, annotationPointForButton, bassPatternActiveButtonIdSet,
    bassPatternEvents, bassPatternNotationRef, bassPatternRenderedNotationVisible, bellowsEndLabel, bellowsLabelY, bellowsStartLabel,
    bellowsStripY, buttonSize, buttonTrebleFooter, buttons, cancelInlineAnnotation, chordDisplayStyle,
    chordFinderActive, chordFinderButtons, chordLabelMode, clearHarmonyWork, colorTheme, commitInlineAnnotation,
    downloadCurrentDiagram, downloadFormat, effectiveTitleSize, finalTitle, finderAnnotationDisplayLines, finderArrowheadMarkerId,
    finderButtonIds, finderExplanationFontSize, finderFooterEnabled, finderFooterHeight, finderVoicingAnalysis, finderVoicingChartVisible,
    fingeringPosition, getMainLabel, handleHarmonyChordActivated, handleSvgClick, harmonyAllFamiliesMode, harmonyAvailableCounts,
    harmonyColorByFamily, harmonyCounts, harmonyDiameter, harmonyEffectiveDiatonicOnly, harmonyEffectiveHighlightDiatonic, harmonyExplanation,
    harmonyFocusedReferenceRootPc, harmonyFontSize, harmonyPlaybackStyle, harmonyProgressionActiveButtonIdSet, harmonyProgressionNotationRef, harmonyProgressionNotationVisible,
    harmonyProgressionPlan, harmonyRecordedNotationRef, harmonyRecordedNotationVisible, harmonyRecordedProgression, harmonyReferenceFamily, harmonyReferenceFamilyId,
    harmonyRelatedFamilyId, harmonyRelatedName, harmonyScale, harmonyScaleId, harmonySectors, harmonyShowEnharmonics,
    harmonyShowExplanation, harmonyShowLegend, harmonyShowNoteRing, harmonyShowSeparators, harmonyShowToneTooltips, harmonySvgRef,
    harmonyVoicingStyle, inlineAnnotationEditor, labelFont, labelFontSize, language, leftPanelMode,
    mobileDiagramView, navigateToTool, overlays, playHarmonyChord, playHarmonyChordRelationship, playHarmonyNote,
    progressionPreviewButtonIds, resetCurrentToolDefaults, resetDiagramWork, scaleFinderArrowStyle, scaleFinderButtons, selectAccordionSide,
    selectedBassPattern, selectedChordProgression, sequenceArrowStyle, sequenceArrowheadMarkerId, sequenceArrowheadSize, sequenceNotationRef,
    sequenceNumberPosition, sequenceRenderedNotationVisible, sequenceSteps, sequenceStepsWithButtons, setDownloadFormat, setHarmonySelection,
    setInlineAnnotationEditor, setMobileDiagramView, setPanel, setSoundEnabled, showBellowsGuide, showButtonLabels,
    showScaleFinderArrows, showScaleFinderNumbers, showSequenceArrows, showSequenceNumbers, showStatusBar, showStradellaRowLabels,
    side, soundEnabled, statusBarText, stopAbcPlayback, stopBassPatternPlayback, stradellaChordFinderActive,
    stradellaChordFinderPattern, stradellaChordFinderRoot, stradellaFinderFooterY, stradellaPrimaryFinderButtonIds, stradellaRootBassFinderButtonIds, svgRef,
    svgStyle, t, textNotes, titleFont, titleMode, toggleAbcNotation,
    toggleBassPatternNotation, toggleButton, toggleFocusPanel, toggleHarmonyProgressionNotation, toggleHarmonyRecordedNotation, toggleSequenceNotation,
    trebleFooterEnabled, trebleFooterFontSize, trebleFooterHeight, trebleFooterY, trebleVoicingNote, viewHeight,
    viewWidth, visibleRows, workspaceMode,
  } = model;
  return (
    <section className="workspace">
        <WorkspaceToolbar
          t={t} workspaceMode={workspaceMode} side={side} leftPanelMode={leftPanelMode}
          activeToolSection={activeToolSection}
          onSelectStradella={() => { selectAccordionSide("stradella"); stopAbcPlayback(); }}
          onSelectTreble={() => { selectAccordionSide("treble"); stopAbcPlayback(); }}
          onSelectHarmony={() => {
            navigateToTool("harmonyExplorer");
            stopAbcPlayback(); stopBassPatternPlayback(); stopAllSound();
          }}
          onShowSettings={() => setPanel("settings")}
          onShowTools={() => setPanel("tools")}
          onToggleFocus={toggleFocusPanel}
          bassPatternEvents={bassPatternEvents}
          bassPatternRenderedNotationVisible={bassPatternRenderedNotationVisible}
          onToggleBassPatternNotation={toggleBassPatternNotation}
          harmonyRecordedProgression={harmonyRecordedProgression}
          harmonyRecordedNotationVisible={harmonyRecordedNotationVisible}
          onToggleHarmonyRecordedNotation={toggleHarmonyRecordedNotation}
          harmonyProgressionPlayable={harmonyProgressionPlan.playable}
          harmonyProgressionNotationVisible={harmonyProgressionNotationVisible}
          onToggleHarmonyProgressionNotation={toggleHarmonyProgressionNotation}
          abcText={abcText} abcRenderedNotationVisible={abcRenderedNotationVisible}
          onToggleAbcNotation={toggleAbcNotation}
          sequenceStepsWithButtons={sequenceStepsWithButtons}
          sequenceRenderedNotationVisible={sequenceRenderedNotationVisible}
          onToggleSequenceNotation={toggleSequenceNotation}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(current => !current)}
          onClearWork={() => { if (workspaceMode === "harmony") clearHarmonyWork(); else resetDiagramWork(); }}
          onRestoreToolDefaults={resetCurrentToolDefaults}
          downloadFormat={downloadFormat} setDownloadFormat={setDownloadFormat}
          onDownloadDiagram={downloadCurrentDiagram}
        />

        {showStatusBar && workspaceMode === "accordion" && (
          <div className="status-bar" title={statusBarText}>
            {statusBarText}
          </div>
        )}
        {showStatusBar && workspaceMode === "harmony" && (
          <div className="status-bar">
            {harmonyStatusText({
              referenceFamilyId: harmonyReferenceFamily.id,
              referenceFamilyEnglishName: harmonyReferenceFamily.name,
              relatedFamilyId: harmonyRelatedFamilyId,
              relatedFamilyEnglishName: harmonyRelatedName,
              scaleId: harmonyScale.id,
              scaleEnglishName: harmonyScale.name,
              soundEnabled, language,
            })}
          </div>
        )}

        {workspaceMode === "accordion" && (
          <div className="mobile-diagram-view-control">
            <SegmentedChoice
              label={t("ui.mobileDiagram")}
              value={mobileDiagramView}
              onChange={setMobileDiagramView}
              options={[
                { value: "readable", label: t("ui.readableScroll") },
                { value: "fit", label: t("ui.fitDiagram") },
              ]}
            />
          </div>
        )}

        {workspaceMode === "harmony" ? (
          <>
            {harmonyAvailableCounts.length === 0 && (
              <div className="harmony-empty-result">
                {t("ui.noChordRelationshipsSatisfyTheCurrentHarmonicFilter")}
              </div>
            )}
            {harmonyAvailableCounts.length > 0 && harmonyCounts.length === 0 && (
              <div className="harmony-empty-result">
                {t("ui.allAvailableOuterRingsAreHiddenReEnableAtLeastOneRingInHarmonyExplorer")}
              </div>
            )}
            <div className="canvas-wrap harmony-canvas-wrap">
              <div
                className="harmony-svg-host"
                style={{
                  width: `${harmonyDiameter + (harmonyShowLegend || harmonyShowExplanation ? Math.max(460, harmonyDiameter * 0.65) : 0)}px`,
                }}
              >
                <HarmonicCircle
                  chordDisplayStyle={chordDisplayStyle}
                  sectors={harmonySectors}
                  counts={harmonyCounts}
                  referenceFamilyId={harmonyReferenceFamilyId}
                  relatedFamilyName={harmonyRelatedDisplayName(harmonyRelatedFamilyId, harmonyRelatedName, language)}
                  allFamiliesMode={harmonyAllFamiliesMode}
                  scaleId={harmonyScaleId}
                  diatonicOnly={harmonyEffectiveDiatonicOnly}
                  highlightDiatonic={harmonyEffectiveHighlightDiatonic}
                  showEnharmonics={harmonyShowEnharmonics}
                  showSeparators={harmonyShowSeparators}
                  showLegend={harmonyShowLegend}
                  showExplanation={harmonyShowExplanation}
                  explanation={harmonyExplanation}
                  showToneTooltips={harmonyShowToneTooltips}
                  showNoteRing={harmonyShowNoteRing}
                  colorByFamily={harmonyColorByFamily}
                  diameter={harmonyDiameter}
                  fontSize={harmonyFontSize}
                  playbackStyle={harmonyPlaybackStyle}
                  voicingStyle={harmonyVoicingStyle}
                  svgRef={harmonySvgRef}
                  focusedReferenceRootPc={harmonyFocusedReferenceRootPc}
                  onPlayChord={playHarmonyChord}
                  onPlayNote={playHarmonyNote}
                  onChordActivated={handleHarmonyChordActivated}
                  onPlayRelationship={playHarmonyChordRelationship}
                  onSelectionChange={setHarmonySelection}
                />
              </div>
            </div>
          </>
        ) : (
        <div
          className={`canvas-wrap ${mobileDiagramView === "readable" ? "diagram-readable" : "diagram-fit"}`}
          style={{ "--mobile-diagram-readable-width": `${Math.max(960, viewWidth * 0.75)}px` } as CSSProperties}
        >
          <DiagramSvgSurface
            ref={svgRef} colorTheme={colorTheme} accidentalStyle={accidentalStyle}
            annotationActive={activeToolSection === "annotateDiagram"}
            viewWidth={viewWidth} viewHeight={viewHeight}
            onClick={handleSvgClick} style={svgStyle}
          >
            <defs>
              <marker
                id={sequenceArrowheadMarkerId}
                markerWidth={sequenceArrowheadSize + 1}
                markerHeight={sequenceArrowheadSize + 1}
                refX={sequenceArrowheadSize}
                refY={sequenceArrowheadSize / 2}
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path
                  d={`M 0 0 L ${sequenceArrowheadSize} ${sequenceArrowheadSize / 2} L 0 ${sequenceArrowheadSize} z`}
                  className="sequence-arrowhead"
                />
              </marker>

              <marker
                id={finderArrowheadMarkerId}
                markerWidth="5"
                markerHeight="5"
                refX="4"
                refY="2.5"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 0 0 L 5 2.5 L 0 5 z" className="finder-arrowhead" />
              </marker>
            </defs>

            {titleMode !== "none" && (
              <text
                x={viewWidth / 2}
                y="34"
                textAnchor="middle"
                className={`title ${fontClass(titleFont)}`}
                style={{ fontSize: effectiveTitleSize }}
              >
                {finalTitle}
              </text>
            )}

            {(finderFooterEnabled || trebleFooterEnabled) && (
              <foreignObject
                x={32}
                y={trebleFooterEnabled ? trebleFooterY : stradellaFinderFooterY}
                width={viewWidth - 64}
                height={trebleFooterEnabled && buttonTrebleFooter ? trebleFooterHeight : trebleFooterEnabled ? 128 : finderFooterHeight}
              >
                <div style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: `${trebleFooterEnabled ? trebleFooterFontSize : finderExplanationFontSize}px`,
                  fontWeight: trebleFooterEnabled ? 600 : 400,
                  textAlign: finderFooterEnabled ? "left" : "center",
                  lineHeight: finderFooterEnabled ? 1.3 : 1.15,
                  overflowWrap: "anywhere", color: "#20252a",
                }}>
                  {finderFooterEnabled
                    ? (
                      <div className="finder-annotation-block">
                        {finderAnnotationDisplayLines.map((line, index) => {
                          const level = annotationLevelForLine(line);
                          const colon = line.indexOf(":");
                          const label = colon > 0 ? line.slice(0, colon + 1) : "";
                          const value = colon > 0 ? line.slice(colon + 1).trim() : line;
                          const showVoicingChart = level === "voicing" && finderVoicingChartVisible && finderVoicingAnalysis;
                          return (
                            <div
                              key={`${level ?? "line"}-${index}`}
                              className={`finder-annotation-line${showVoicingChart ? " finder-annotation-line-voicing" : ""}`}
                            >
                              {label && (
                                <div className="finder-annotation-label">
                                  <strong>{label}</strong>
                                </div>
                              )}
                              <div className="finder-annotation-value">
                                {showVoicingChart ? (
                                  <StradellaVoicingIntervals
                                    notes={finderVoicingAnalysis.notes}
                                    root={stradellaChordFinderRoot}
                                    pattern={stradellaChordFinderPattern}
                                    fontSize={finderExplanationFontSize}
                                  />
                                ) : value}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                    : trebleVoicingNote}
                </div>
              </foreignObject>
            )}

            {showBellowsGuide && (
              <>
                <text
                  x="76"
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  {bellowsStartLabel}
                </text>

                <text
                  x={viewWidth / 2}
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-label"
                >
                  {t("ui.bellows")}
                </text>

                <text
                  x={viewWidth - 76}
                  y={bellowsLabelY}
                  textAnchor="middle"
                  className="bellows-end-label"
                >
                  {bellowsEndLabel}
                </text>
              </>
            )}

            {showBellowsGuide && (
              <rect
                x="72"
                y={bellowsStripY}
                width={viewWidth - 150}
                height="12"
                rx="6"
                className="bellows-strip"
              />
            )}

            {side === "stradella" &&
              showStradellaRowLabels &&
              visibleRows.map((kind) => {
                const sample = buttons.find(
                  (button) => button.kind === kind && button.column === 0,
                );
                if (!sample) return null;

                return (
                  <text
                    key={kind}
                    x={sample.x - buttonSize - 10}
                    y={sample.y + 4}
                    textAnchor="end"
                    className="stradella-row-label"
                  >
                    {stradellaDiagramRowLabel(kind, stradellaRowLabel(kind), language)}
                  </text>
                );
              })}

            <DiagramButtonLayer
              buttons={buttons} overlays={overlays} sequenceSteps={sequenceSteps}
              scaleFinderButtons={scaleFinderButtons} finderButtonIds={finderButtonIds}
              progressionPreviewButtonIds={progressionPreviewButtonIds}
              abcActiveButtonIdSet={abcActiveButtonIdSet}
              bassPatternActiveButtonIdSet={bassPatternActiveButtonIdSet}
              harmonyProgressionActiveButtonIdSet={harmonyProgressionActiveButtonIdSet}
              stradellaChordFinderActive={stradellaChordFinderActive}
              stradellaPrimaryFinderButtonIds={stradellaPrimaryFinderButtonIds}
              stradellaRootBassFinderButtonIds={stradellaRootBassFinderButtonIds}
              getMainLabel={getMainLabel} toggleButton={toggleButton}
              buttonSize={buttonSize} chordLabelMode={chordLabelMode}
              showScaleFinderNumbers={showScaleFinderNumbers} labelFontSize={labelFontSize}
              showButtonLabels={showButtonLabels} labelFont={labelFont}
              showSequenceNumbers={showSequenceNumbers}
              sequenceNumberPosition={sequenceNumberPosition}
              annotationActive={activeToolSection === "annotateDiagram"}
              annotationPointForButton={annotationPointForButton}
              annotationButtonAnchor={annotationButtonAnchor}
              fingeringPosition={fingeringPosition}
            />

            <DiagramConnections
              showScaleFinderArrows={showScaleFinderArrows}
              scaleFinderButtons={scaleFinderButtons}
              chordFinderActive={chordFinderActive} chordFinderButtons={chordFinderButtons}
              showSequenceArrows={showSequenceArrows}
              sequenceStepsWithButtons={sequenceStepsWithButtons} buttonSize={buttonSize}
              scaleFinderArrowStyle={scaleFinderArrowStyle} sequenceArrowStyle={sequenceArrowStyle}
              finderArrowheadMarkerId={finderArrowheadMarkerId}
              sequenceArrowheadMarkerId={sequenceArrowheadMarkerId}
            />

            <DiagramAnnotationsLayer
              textNotes={textNotes} inlineAnnotationEditor={inlineAnnotationEditor}
              setInlineAnnotationEditor={setInlineAnnotationEditor}
              annotationEditorRef={annotationEditorRef}
              commitInlineAnnotation={commitInlineAnnotation}
              cancelInlineAnnotation={cancelInlineAnnotation}
              viewWidth={viewWidth} viewHeight={viewHeight}
              annotationPlaceholder={t("ui.annotationPlaceholder")}
            />
          </DiagramSvgSurface>
        </div>
        )}

        {workspaceMode === "harmony" &&
          harmonyRecordedProgression.length > 0 &&
          harmonyRecordedNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.recordedHarmonyAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">{t("ui.recordedHarmonyProgression")}</div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      harmonyRecordedNotationRef.current,
                      "recorded-harmony-progression-notation",
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={harmonyRecordedNotationRef} className="rendered-abc" />
            </div>
          )}

        {workspaceMode === "accordion" && side === "stradella" &&
          activeToolSection === "bassPatternPlayer" &&
          bassPatternEvents.length > 0 &&
          bassPatternRenderedNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.renderedStradellaAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">
                  {selectedBassPattern ? bassPatternName(selectedBassPattern.id, selectedBassPattern.name, language) : t("ui.bassPatternPlayer")} {t("ui.over")}{" "}
                  {selectedChordProgression ? progressionName(selectedChordProgression.id, selectedChordProgression.name, language) : t("ui.progression")}
                </div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      bassPatternNotationRef.current,
                      `${selectedBassPattern?.id ?? "bass-pattern"}-notation`,
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={bassPatternNotationRef} className="rendered-abc" />
            </div>
          )}

        {workspaceMode === "accordion" && side === "stradella" &&
          activeToolSection === "progressionAssistant" &&
          harmonyProgressionPlan.playable &&
          harmonyProgressionNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.renderedProgressionAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">
                  {t("ui.optimizedStradellaProgression")}
                </div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      harmonyProgressionNotationRef.current,
                      "optimized-stradella-progression-notation",
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={harmonyProgressionNotationRef} className="rendered-abc" />
            </div>
          )}

        {workspaceMode === "accordion" && activeToolSection === "abcPlayer" &&
          abcText.trim() &&
          abcRenderedNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.renderedABCAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">
                  {abcParseResult.title || "ABC notation"}
                </div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      abcNotationRef.current,
                      `${abcParseResult.title || "abc"}-notation`,
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={abcNotationRef} className="rendered-abc" />
            </div>
          )}

        {workspaceMode === "accordion" && activeToolSection === "sequences" &&
          sequenceStepsWithButtons.length > 0 &&
          sequenceRenderedNotationVisible && (
            <div
              className="rendered-notation-panel"
              aria-label={t("ui.renderedSequenceAria")}
            >
              <div className="rendered-notation-header">
                <div className="rendered-notation-title">{t("ui.sequenceNotation")}</div>
                <button
                  type="button"
                  className="small-button notation-download-button"
                  onClick={() =>
                    downloadRenderedNotationSvg(
                      sequenceNotationRef.current,
                      "sequence-notation",
                    )
                  }
                >
                  {t("ui.downloadSVG")}
                </button>
              </div>
              <div ref={sequenceNotationRef} className="rendered-abc" />
            </div>
          )}
      </section>
  );
}
