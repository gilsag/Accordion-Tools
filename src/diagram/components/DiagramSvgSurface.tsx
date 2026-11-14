import { forwardRef } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { AccidentalStyle, ColorTheme } from "../../types";

type DiagramSvgSurfaceProps = {
  colorTheme: ColorTheme;
  accidentalStyle: AccidentalStyle;
  annotationActive: boolean;
  viewWidth: number;
  viewHeight: number;
  style: CSSProperties;
  onClick: (event: MouseEvent<SVGSVGElement>) => void;
  /** Accessible name of the drawing, such as its title. */
  label: string;
  children: ReactNode;
};

/** Stable SVG serialization and pointer-coordinate boundary. This wrapper
 * preserves viewBox, class names, DOM order and ref to the real SVG element.
 */
export const DiagramSvgSurface = forwardRef<SVGSVGElement, DiagramSvgSurfaceProps>(
  function DiagramSvgSurface(
    {
      colorTheme,
      accidentalStyle,
      annotationActive,
      viewWidth,
      viewHeight,
      style,
      onClick,
      label,
      children,
    },
    ref,
  ) {
    return (
      <svg
        ref={ref}
        preserveAspectRatio="xMinYMin meet"
        className={`diagram diagram-theme-${colorTheme} accidental-style-${accidentalStyle} ${annotationActive ? "annotating-diagram" : ""}`}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        // A group, not an image: the buttons inside are interactive. Exports
        // become role="img" again (download.ts).
        role="group"
        aria-label={label}
        onClick={onClick}
        style={style}
      >
        {children}
      </svg>
    );
  },
);
