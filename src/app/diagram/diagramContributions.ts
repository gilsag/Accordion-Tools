/** What each tool contributes to the accordion diagram, and how the
 * contributions combine. A tool's output provider contributes through
 * `DiagramContributionProvider`; `useDiagramModel()` reads the result.
 *
 * Highlight layers, SVG style and extra layers are combined from every tool,
 * because a tool's marks stay drawn while another tool is open (annotations,
 * a Finder kept active). The title, file name and footer, the two-hand view
 * and the click handlers are the open tool's, or else, for the title, those
 * of another tool that is still active: only Finders stay active with their
 * section closed, and at most one Finder is active at a time. */
import {
  createContext,
  useContext,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { DiagramButtonLayer } from "../../diagram/components/DiagramButtonLayer";
import type { DiagramConnections } from "../../diagram/components/DiagramConnections";
import type { StradellaVoicingIntervals } from "../../features/stradellaChordFinder/StradellaVoicingIntervals";
import type { StradellaNoteLevels } from "../../features/stradellaChordFinder/engine/diagramAnnotations";
import type { DiagramButton, FinderChordPattern, Side } from "../../types";
import { usePlatformNavigation } from "../platform/platformContexts";
import type { ToolId } from "../toolRegistry";

type ButtonLayerProps = ComponentProps<typeof DiagramButtonLayer>;
type ConnectionsProps = ComponentProps<typeof DiagramConnections>;

/** The tool-specific inputs of the button and connection layers. */
export type DiagramLayers = Pick<
  ButtonLayerProps,
  | "overlays"
  | "sequenceSteps"
  | "scaleFinderButtons"
  | "finderButtonIds"
  | "progressionPreviewButtonIds"
  | "abcActiveButtonIdSet"
  | "bassPatternActiveButtonIdSet"
  | "harmonyProgressionActiveButtonIdSet"
  | "stradellaChordFinderActive"
  | "stradellaPrimaryFinderButtonIds"
  | "stradellaRootBassFinderButtonIds"
  | "showScaleFinderNumbers"
  | "showSequenceNumbers"
  | "sequenceNumberPosition"
  | "annotationActive"
  | "annotationPointForButton"
  | "annotationButtonAnchor"
  | "fingeringPosition"
> &
  Pick<
    ConnectionsProps,
    | "showScaleFinderArrows"
    | "chordFinderActive"
    | "chordFinderButtons"
    | "showSequenceArrows"
    | "sequenceStepsWithButtons"
    | "scaleFinderArrowStyle"
    | "sequenceArrowStyle"
  >;

const NO_IDS: ReadonlySet<string> = new Set();

/** The layers with no tool marking anything. */
export const EMPTY_LAYERS: DiagramLayers = {
  overlays: {},
  sequenceSteps: [],
  scaleFinderButtons: [],
  finderButtonIds: NO_IDS,
  progressionPreviewButtonIds: NO_IDS,
  abcActiveButtonIdSet: NO_IDS,
  bassPatternActiveButtonIdSet: NO_IDS,
  harmonyProgressionActiveButtonIdSet: NO_IDS,
  stradellaChordFinderActive: false,
  stradellaPrimaryFinderButtonIds: NO_IDS,
  stradellaRootBassFinderButtonIds: NO_IDS,
  showScaleFinderNumbers: false,
  showSequenceNumbers: false,
  sequenceNumberPosition: "none",
  annotationActive: false,
  annotationPointForButton: (button) => ({ x: button.x, y: button.y }),
  annotationButtonAnchor: "center",
  fingeringPosition: "none",
  showScaleFinderArrows: false,
  chordFinderActive: false,
  chordFinderButtons: [],
  showSequenceArrows: false,
  sequenceStepsWithButtons: [],
  scaleFinderArrowStyle: "straight",
  sequenceArrowStyle: "straight",
};

/** The Stradella footer: the explanation of a realization, line by line,
 * with the registral voicing drawn as a chart when it has two or more notes. */
export type StradellaFooter = {
  kind: "stradella";
  lines: string[];
  fontSize: number;
  levelForLine(line: string): keyof StradellaNoteLevels | null;
  /** The voicing chart, when shown, and its height. */
  voicing: {
    notes: ComponentProps<typeof StradellaVoicingIntervals>["notes"];
    height: number;
  } | null;
  root: string;
  pattern: FinderChordPattern;
};

/** The treble footer: one note about the shown chord. */
export type TrebleFooter = { kind: "treble"; text: string };

/** What a tool says about the diagram while it is active. */
export type DiagramNote = {
  /** The title in the contextual title mode. */
  title: string;
  /** The downloaded file's name in the contextual title mode: undefined for
   * the shown title, null for the automatic title. */
  filename?: string | null;
  footer?: StradellaFooter | TrebleFooter | null;
};

/** Both manuals drawn together in place of the diagram. */
export type HandsView = {
  hands: { key: Side; caption: string; buttons: DiagramButton[] }[];
  activeButtonIds: ReadonlySet<string>;
  /** Narrower diagrams, under a timeline. */
  compact?: boolean;
  /** Shown above the diagram, such as a timeline. */
  above?: ReactNode;
  /** The downloaded file's name, if not the diagram's. */
  filename?: string;
};

/** The size of the drawn diagram, in SVG units. */
export type DiagramView = { viewWidth: number; viewHeight: number };

export type DiagramContribution = {
  note?: DiagramNote | null;
  layers?: Partial<DiagramLayers>;
  /** CSS variables for the diagram's SVG. */
  style?: CSSProperties;
  handsView?: HandsView | null;
  /** SVG drawn over the buttons and connections, in tool order, given the
   * diagram's size. */
  overlay?(view: DiagramView): ReactNode;
  /** While the tool is open: what a click on a button does besides sounding
   * it; "silent" keeps it from sounding. */
  onButton?(button: DiagramButton): "silent" | void;
  /** While the tool is open: a click on the diagram's background, in SVG
   * coordinates. */
  onSurfaceClick?(point: { x: number; y: number }): void;
};

export type DiagramContributions = Partial<Record<ToolId, DiagramContribution>>;
export const DiagramContributionsContext = createContext<DiagramContributions>({});

/** Highlights are additive: id sets are joined and flags ORed; any other
 * value comes from the one tool that supplies it. */
function mergeLayers(parts: Partial<DiagramLayers>[]): DiagramLayers {
  const merged: Record<string, unknown> = { ...EMPTY_LAYERS };
  const supplied = new Set<string>();
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      if (value === undefined) continue;
      const current = merged[key];
      if (supplied.has(key) && current instanceof Set && value instanceof Set)
        merged[key] = new Set([...current, ...value]);
      else if (supplied.has(key) && typeof current === "boolean" && typeof value === "boolean")
        merged[key] = current || value;
      else merged[key] = value;
      supplied.add(key);
    }
  }
  return merged as DiagramLayers;
}

/** The tools' contributions, combined as described at the top of this file. */
export function useDiagramContributions() {
  const entries = useContext(DiagramContributionsContext);
  const { activeToolSection } = usePlatformNavigation();
  const all = Object.values(entries).filter((entry) => entry !== undefined);
  const open = activeToolSection ? entries[activeToolSection] : undefined;
  return {
    note: open?.note ?? all.find((entry) => entry.note)?.note ?? null,
    layers: mergeLayers(all.flatMap((entry) => (entry.layers ? [entry.layers] : []))),
    style: Object.assign({}, ...all.map((entry) => entry.style)) as CSSProperties,
    handsView: open?.handsView ?? null,
    overlays: all.flatMap((entry) => (entry.overlay ? [entry.overlay] : [])),
    onButton: open?.onButton,
    onSurfaceClick: open?.onSurfaceClick,
  };
}
