import { useState } from "react";

/** Presentation-only visibility state shared by every tool inspector.
 * It never duplicates the active tool or its selected musical result. */
export function useInspectorVisibility() {
  const [visible, setVisible] = useState(true);
  return { visible, toggle: () => setVisible((current) => !current) };
}
