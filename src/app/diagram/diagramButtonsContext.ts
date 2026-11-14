import { createContext, useContext } from "react";
import type { DiagramButton } from "../../types";

/** Asks the compact treble sizes to keep some buttons on screen: given the
 * full-size reference layout, returns the buttons a tool needs visible (its
 * result, or the marked buttons). Only their columns matter. */
export type KeepVisible = (reference: DiagramButton[]) => DiagramButton[];

/** Every keep-visible request of the providers above, outermost first. */
export const KeepVisibleContext = createContext<readonly KeepVisible[]>([]);
export const useKeepVisibleRequests = () => useContext(KeepVisibleContext);

export interface DiagramButtons {
  /** The buttons of the side on screen, as the diagram draws them. */
  buttons: DiagramButton[];
}
export const DiagramButtonsContext = createContext<DiagramButtons | null>(null);

/** The diagram's buttons, for the tools' output providers and the views. */
export function useDiagramButtons(): DiagramButtons {
  const value = useContext(DiagramButtonsContext);
  if (value === null) throw new Error("useDiagramButtons() must be called inside <AppProviders>.");
  return value;
}
