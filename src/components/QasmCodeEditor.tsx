/**
 * OpenQASM text editor with line numbers. Lines can be highlighted from outside (the step
 * clicked in Math Mode), and the line of the cursor is reported, so that clicking a line
 * shows its step in Math Mode. Problems in the code (unknown operations, qubits that do
 * not exist) are marked on their line and listed below the code.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { QasmProblem } from "./utils/qasmValidate";

const LINE_HEIGHT = 20;
const PADDING = 12;

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** 0-based lines to highlight. */
  highlightLines?: number[];
  /** 0-based lines highlighted more lightly, e.g. the earlier steps on the path. */
  pathLines?: number[];
  /** Called with the 0-based line of the cursor when the user clicks or moves it. */
  onCursorLine?: (line: number) => void;
  placeholder?: string;
  /** Problems found in the code (see validateQasm), marked on their lines. */
  problems?: QasmProblem[];
}

export function QasmCodeEditor({
  value,
  onChange,
  highlightLines = [],
  pathLines = [],
  onCursorLine,
  placeholder,
  problems = [],
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const lines = value.split("\n");
  const lineCount = Math.max(1, lines.length);
  // empty lines are never highlighted, e.g. when a highlight was made for other code
  const hasCode = (l: number) => !!lines[l]?.trim();
  const highlighted = new Set(highlightLines.filter(hasCode));
  const onPath = new Set(
    pathLines.filter((l) => hasCode(l) && !highlighted.has(l)),
  );

  const problemsByLine = useMemo(() => {
    const byLine = new Map<number, string[]>();
    for (const p of problems)
      byLine.set(p.line, [...(byLine.get(p.line) ?? []), p.message]);
    return byLine;
  }, [problems]);

  const scrollToLine = (line: number) => {
    const el = textareaRef.current;
    if (!el) return;
    const top = PADDING + line * LINE_HEIGHT;
    if (
      top < el.scrollTop ||
      top + LINE_HEIGHT > el.scrollTop + el.clientHeight
    )
      el.scrollTop = Math.max(0, top - el.clientHeight / 3);
  };

  // bring the first highlighted line into view (e.g. after clicking a step)
  const firstLine = highlighted.size > 0 ? Math.min(...highlighted) : -1;
  useEffect(() => {
    if (firstLine >= 0) scrollToLine(firstLine);
  }, [firstLine, highlighted.size]);

  const reportCursor = () => {
    const el = textareaRef.current;
    if (!el || !onCursorLine) return;
    onCursorLine(value.slice(0, el.selectionStart).split("\n").length - 1);
  };

  // puts the cursor on a line, e.g. when a problem in the list is clicked
  const goToLine = (line: number) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = lines.slice(0, line).reduce((n, l) => n + l.length + 1, 0);
    el.focus();
    el.setSelectionRange(start, start + (lines[line]?.length ?? 0));
    scrollToLine(line);
    onCursorLine?.(line);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex font-mono text-xs overflow-hidden">
        {/* line numbers, red for lines with a problem */}
        <div
          className="flex-shrink-0 overflow-hidden bg-gray-50 border-r border-gray-200 text-right text-gray-400 select-none"
          style={{ width: 40 }}
        >
          <div
            style={{
              paddingTop: PADDING,
              transform: `translateY(${-scrollTop}px)`,
            }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i}
                className={`pr-1.5 ${
                  problemsByLine.has(i)
                    ? "text-red-600 font-semibold bg-red-100 cursor-help"
                    : highlighted.has(i)
                      ? "text-blue-600 font-semibold"
                      : onPath.has(i)
                        ? "text-blue-400"
                        : ""
                }`}
                style={{ height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px` }}
                title={problemsByLine.get(i)?.join("\n")}
              >
                {problemsByLine.has(i) ? `⚠${i + 1}` : i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {/* highlighted lines and lines with a problem, behind the transparent textarea */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `translateY(${-scrollTop}px)` }}
          >
            {[...problemsByLine.keys()].map((line) => (
              <div
                key={`problem-${line}`}
                className="absolute left-0 right-0 bg-red-50 border-b border-dashed border-red-400"
                style={{
                  top: PADDING + line * LINE_HEIGHT,
                  height: LINE_HEIGHT,
                }}
              />
            ))}
            {[...onPath].map((line) => (
              <div
                key={`path-${line}`}
                className="absolute left-0 right-0 bg-blue-50 border-l-2 border-blue-200"
                style={{
                  top: PADDING + line * LINE_HEIGHT,
                  height: LINE_HEIGHT,
                }}
              />
            ))}
            {[...highlighted].map((line) => (
              <div
                key={line}
                className="absolute left-0 right-0 bg-blue-100 border-l-2 border-blue-500"
                style={{
                  top: PADDING + line * LINE_HEIGHT,
                  height: LINE_HEIGHT,
                }}
              />
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onClick={reportCursor}
            onKeyUp={(e) => {
              if (
                e.key.startsWith("Arrow") ||
                e.key === "Home" ||
                e.key === "End"
              )
                reportCursor();
            }}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            wrap="off"
            spellCheck={false}
            className="relative w-full h-full resize-none bg-transparent text-black outline-none whitespace-pre"
            style={{
              padding: PADDING,
              lineHeight: `${LINE_HEIGHT}px`,
              caretColor: "black",
            }}
            placeholder={placeholder}
          />
        </div>
      </div>

      {/* list of problems; clicking one moves the cursor to its line */}
      {problems.length > 0 && (
        <div className="flex-shrink-0 max-h-28 overflow-y-auto border-t border-red-200 bg-red-50 text-xs">
          <p className="px-2 pt-1 font-semibold text-red-700">
            ⚠ {problems.length} problem{problems.length === 1 ? "" : "s"}
          </p>
          {problems.map((p, i) => (
            <button
              key={i}
              onClick={() => goToLine(p.line)}
              className="block w-full text-left px-2 py-0.5 text-red-700 hover:bg-red-100"
              title="Go to this line"
            >
              <span className="font-mono text-red-500">Line {p.line + 1}:</span>{" "}
              {p.message}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
