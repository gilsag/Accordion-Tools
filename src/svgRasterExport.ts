/** Convert SVG foreignObject content into native SVG primitives for PNG export.
 * Browsers can display XHTML inside foreignObject but consider a canvas drawn
 * from that SVG origin-unclean. Native SVG shapes and text avoid that restriction.
 * The live diagram and normal SVG downloads remain unchanged. */
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function createSvgNode<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NAMESPACE, tag);
}

function formatMatrix(matrix: DOMMatrix): string {
  return `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`;
}

function emitTextLines(source: SVGForeignObjectElement, target: SVGGElement, inverse: DOMMatrix) {
  const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const sourceText = textNode.data;
    const parent = textNode.parentElement;
    if (!parent || !sourceText.trim()) continue;
    const owningSvg = parent.closest("svg");
    if (owningSvg && source.contains(owningSvg)) continue;
    const style = getComputedStyle(parent);
    if (style.display === "none" || style.visibility === "hidden") continue;

    const range = document.createRange();
    type Segment = { text: string; top: number; left: number };
    const lines: Segment[] = [];
    let start = 0;
    while (start < sourceText.length) {
      range.setStart(textNode, start);
      range.setEnd(textNode, sourceText.length);
      const rectangles = range.getClientRects();
      if (!rectangles.length) break;
      const first = rectangles[0];
      if (!first.width || !first.height) break;
      if (rectangles.length === 1) {
        lines.push({ text: sourceText.slice(start), top: first.top, left: first.left });
        break;
      }
      // Find the wrap boundary with logarithmic DOM measurements instead of
      // querying the geometry of every glyph separately.
      let lower = start + 1;
      let upper = sourceText.length;
      while (lower < upper) {
        const middle = Math.floor((lower + upper + 1) / 2);
        range.setEnd(textNode, middle);
        const fragments = range.getClientRects();
        if (fragments.length <= 1) lower = middle;
        else upper = middle - 1;
      }
      if (lower <= start) break;
      lines.push({ text: sourceText.slice(start, lower), top: first.top, left: first.left });
      start = lower;
    }
    range.detach();

    for (const line of lines) {
      if (!line.text.trim()) continue;
      const point = new DOMPoint(line.left, line.top).matrixTransform(inverse);
      const svgText = createSvgNode("text");
      svgText.setAttribute("x", String(point.x));
      svgText.setAttribute("y", String(point.y));
      svgText.setAttribute("dominant-baseline", "text-before-edge");
      svgText.setAttribute("font-family", style.fontFamily);
      svgText.setAttribute("font-size", style.fontSize);
      svgText.setAttribute("font-weight", style.fontWeight);
      svgText.setAttribute("font-style", style.fontStyle);
      svgText.setAttribute("fill", style.color);
      if (style.letterSpacing !== "normal") svgText.setAttribute("letter-spacing", style.letterSpacing);
      svgText.textContent = line.text;
      target.appendChild(svgText);
    }
  }
}

function emitNestedSvg(source: SVGForeignObjectElement, target: SVGGElement, inverse: DOMMatrix) {
  for (const nested of source.querySelectorAll("svg")) {
    // Only outermost nested diagrams are needed; their children are copied.
    const ancestorSvg = nested.parentElement?.closest("svg");
    if (ancestorSvg && source.contains(ancestorSvg)) continue;
    const matrix = nested.getScreenCTM();
    if (!matrix) continue;
    const group = createSvgNode("g");
    group.setAttribute("transform", formatMatrix(inverse.multiply(matrix)));
    const style = getComputedStyle(nested);
    group.setAttribute("font-family", style.fontFamily);
    group.setAttribute("color", style.color);
    group.setAttribute("fill", style.fill);
    for (const child of Array.from(nested.childNodes)) group.appendChild(child.cloneNode(true));
    target.appendChild(group);
  }
}

/** Replaces each rendered foreignObject with content visible in the live diagram.
 * Must run while `source` is still attached to the document. */
export function makeSvgCanvasSafe(source: SVGSVGElement, clone: SVGSVGElement): void {
  const originals = Array.from(source.querySelectorAll("foreignObject"))
    .filter((element) => !element.closest("[data-export-ignore=\"true\"], .annotation-editor-object"));
  const copies = Array.from(clone.querySelectorAll("foreignObject"));
  if (!originals.length) return;
  const screenMatrix = source.getScreenCTM();
  if (!screenMatrix) throw new Error("The diagram must be visible to export it as PNG.");
  const inverse = screenMatrix.inverse();
  for (let index = 0; index < originals.length; index += 1) {
    const original = originals[index];
    const copied = copies[index];
    if (!copied) throw new Error("SVG export content does not match the diagram.");
    const replacement = createSvgNode("g");
    replacement.setAttribute("data-png-export", "foreign-object-content");
    emitNestedSvg(original, replacement, inverse);
    emitTextLines(original, replacement, inverse);
    copied.replaceWith(replacement);
  }
}
