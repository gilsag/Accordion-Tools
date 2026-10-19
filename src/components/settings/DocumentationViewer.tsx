import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import "./DocumentationViewer.css";

// Vite bundles these Markdown files as plain text. No external service is needed.
const guideFiles = import.meta.glob("../../../docs/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;
const rootFiles = import.meta.glob("../../../{README,VERSION_HISTORY}.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const labels: Record<string, string> = {
  "README.md": "Overview (README)",
  "VERSION_HISTORY.md": "Version history",
  "chord-finder.md": "Chord Finder",
  "scale-finder.md": "Scale Finder",
  "harmony-explorer.md": "Harmony Explorer",
  "progression-assistant.md": "Progression Assistant",
  "sequence-tool.md": "Sequence Tool",
  "selection-tool.md": "Selection Tool",
  "fingering-tool.md": "Fingering Tool",
  "annotate-diagram-tool.md": "Annotate Diagram",
  "text-notes-tool.md": "Text Notes",
  "bass-pattern-player.md": "Bass Pattern Player",
  "bass-pattern-format.md": "Bass Pattern Format",
  "abc-player.md": "ABC Player",
  "settings.md": "Settings",
};
const preferredOrder = ["README.md", "chord-finder.md", "scale-finder.md", "harmony-explorer.md", "progression-assistant.md", "bass-pattern-player.md", "sequence-tool.md", "selection-tool.md", "fingering-tool.md", "annotate-diagram-tool.md", "text-notes-tool.md", "abc-player.md", "bass-pattern-format.md", "settings.md", "VERSION_HISTORY.md"];
const documents = Object.entries({ ...guideFiles, ...rootFiles }).map(([path, content]) => {
  const filename = path.split("/").pop() ?? path;
  return { filename, title: labels[filename] ?? filename.replace(/\.md$/, "").replace(/-/g, " "), content };
}).sort((a, b) => {
  const ai = preferredOrder.indexOf(a.filename);
  const bi = preferredOrder.indexOf(b.filename);
  return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
});

function inlineMarkdown(text: string, navigate: (filename: string) => void): ReactNode[] {
  const tokenRe = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  return text.split(tokenRe).filter(Boolean).map((token, i) => {
    if (token.startsWith("`")) return <code key={i}>{token.slice(1, -1)}</code>;
    if (token.startsWith("**")) return <strong key={i}>{token.slice(2, -2)}</strong>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
    if (link) {
      const href = link[2];
      const page = href.split(/[?#]/)[0].split("/").pop() ?? "";
      if (page.endsWith(".md") && documents.some((doc) => doc.filename === page)) {
        return <button key={i} type="button" className="documentation-inline-link" onClick={() => navigate(page)}>{link[1]}</button>;
      }
      if (/^https?:\/\//.test(href)) return <a key={i} href={href} target="_blank" rel="noreferrer">{link[1]}</a>;
      // Don't create broken or unsafe links to build-time assets.
      return <span key={i}>{link[1]}</span>;
    }
    return <span key={i}>{token}</span>;
  });
}

function MarkdownArticle({ source, navigate }: { source: string; navigate: (filename: string) => void }) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (/^```/.test(line)) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push(<pre key={blocks.length}><code data-language={language}>{code.join("\n")}</code></pre>);
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length, 4);
      const content = inlineMarkdown(heading[2], navigate);
      const HeadingTag = (`h${level}`) as "h1" | "h2" | "h3" | "h4";
      blocks.push(<HeadingTag key={blocks.length}>{content}</HeadingTag>);
      i++; continue;
    }
    if (/^---+$/.test(line)) { blocks.push(<hr key={blocks.length}/>); i++; continue; }
    if (line.includes("|") && i + 1 < lines.length && /^\|?[\s|:\-]+\|?$/.test(lines[i+1].trim()) && lines[i+1].includes("-")) {
      const splitCells = (s: string) => s.replace(/^\||\|$/g, "").split("|").map(x => x.trim());
      const header = splitCells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes("|") && lines[i].trim()) rows.push(splitCells(lines[i++]));
      blocks.push(<div className="documentation-table-scroll" key={blocks.length}><table><thead><tr>{header.map((cell,j) => <th key={j}>{inlineMarkdown(cell,navigate)}</th>)}</tr></thead><tbody>{rows.map((row,j) => <tr key={j}>{row.map((cell,k) => <td key={k}>{inlineMarkdown(cell,navigate)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^[-*+]\s+|^\d+[.)]\s+/.test(line)) {
      const ordered = /^\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+[.)]\s+/.test(lines[i]) : /^\s*[-*+]\s+/.test(lines[i]))) {
        items.push(lines[i++].replace(/^\s*(?:[-*+]|\d+[.)])\s+/, ""));
      }
      const children = items.map((item,j) => <li key={j}>{inlineMarkdown(item,navigate)}</li>);
      blocks.push(ordered ? <ol key={blocks.length}>{children}</ol> : <ul key={blocks.length}>{children}</ul>);
      continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && lines[i].trim() && !/^(?:#{1,6}\s|```|[-*+]\s|\d+[.)]\s|---+$)/.test(lines[i].trim())) {
      paragraph.push(lines[i++].trim());
    }
    blocks.push(<p key={blocks.length}>{inlineMarkdown(paragraph.join(" "),navigate)}</p>);
  }
  return <article className="documentation-article">{blocks}</article>;
}

export function DocumentationViewer({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState("README.md");
  const [filter, setFilter] = useState("");
  const selectedDoc = documents.find(doc => doc.filename === selected) ?? documents[0];
  const shownDocs = useMemo(() => documents.filter(doc => `${doc.title} ${doc.content}`.toLowerCase().includes(filter.toLowerCase())), [filter]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="documentation-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="documentation-dialog" role="dialog" aria-modal="true" aria-label="Accordion Tools documentation">
        <header className="documentation-header"><strong>Documentation</strong><button type="button" onClick={onClose} aria-label="Close documentation">Close ×</button></header>
        <div className="documentation-body">
          <nav className="documentation-sidebar" aria-label="Documentation topics">
            <input type="search" placeholder="Find a topic or text…" value={filter} onChange={event => setFilter(event.target.value)} aria-label="Search documentation" />
            {shownDocs.map(doc => <button type="button" key={doc.filename} className={doc.filename === selected ? "active" : ""} onClick={() => setSelected(doc.filename)}>{doc.title}</button>)}
            {shownDocs.length === 0 && <p>No matching topics.</p>}
          </nav>
          <main className="documentation-content" key={selectedDoc?.filename}>{selectedDoc ? <MarkdownArticle source={selectedDoc.content} navigate={setSelected}/> : <p>No documentation found.</p>}</main>
        </div>
      </section>
    </div>, document.body
  );
}
