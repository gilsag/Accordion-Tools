/**
 * Downloads the current SVG, including readable CSS rules.
 */
/**
 * Serializes the current SVG element, embeds readable CSS rules, and downloads it.
 */
export function downloadSvg(svgElement: SVGSVGElement, filename: string) {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  let cssText = "";

  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      Array.from(styleSheet.cssRules).forEach((rule) => {
        cssText += rule.cssText + "\n";
      });
    } catch {
      /* Some browser/security contexts block stylesheet reading. */
    }
  });

  const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleElement.textContent = cssText;
  clone.insertBefore(styleElement, clone.firstChild);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
