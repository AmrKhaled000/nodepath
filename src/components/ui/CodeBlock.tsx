import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import hljs from "highlight.js/lib/common";
import { Check, Copy } from "lucide-react";
import { cn } from "@/utils/cn";

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  dockerfile: "dockerfile",
  yml: "yaml",
  sql: "sql",
  http: "http",
  json: "json",
  text: "plaintext",
  plaintext: "plaintext",
};

export function CodeBlock({
  code,
  language = "javascript",
  title,
  className,
}: {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const html = useMemo(() => {
    const lang = LANGUAGE_ALIASES[language.toLowerCase()] ?? language.toLowerCase();
    try {
      if (hljs.getLanguage(lang)) {
        return hljs.highlight(code.trimEnd(), { language: lang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(code.trimEnd()).value;
    } catch {
      return escapeHtml(code);
    }
  }, [code, language]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable (insecure context) — ignore silently
    }
  }

  return (
    <div className={cn("group/code relative overflow-hidden rounded-lg border border-border bg-code-bg", className)}>
      <div className="flex items-center justify-between border-b border-border bg-surface-2/60 px-3 py-1.5">
        <span className="text-[11.5px] font-medium uppercase tracking-wide text-text-faint">
          {title ?? language}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-1 text-[11.5px] font-medium transition-colors",
            copied ? "text-success" : "text-text-faint hover:text-text hover:bg-surface-3",
          )}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-[1.65] m-0">
        <code className="hljs !bg-transparent !p-0" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[0.86em] text-text">{children}</code>
  );
}
