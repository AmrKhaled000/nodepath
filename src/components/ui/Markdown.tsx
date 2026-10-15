import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";
import { cn } from "@/utils/cn";

export const Markdown = memo(function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={cn("prose-platform", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className: langClass, children: rawChildren }) {
            const isBlock = typeof langClass === "string" && langClass.includes("language-");
            const text = typeof rawChildren === "string" ? rawChildren : String(rawChildren ?? "");
            if (isBlock) {
              const lang = langClass.replace(/^language-/, "");
              return <CodeBlock code={text} language={lang} />;
            }
            // Inline code inside a block: detect fenced content without a language tag
            if (typeof rawChildren === "string" && rawChildren.includes("\n")) {
              return <CodeBlock code={rawChildren} language="javascript" />;
            }
            return <code>{rawChildren}</code>;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table>{children}</table>
              </div>
            );
          },
          a({ href, children: linkChildren }) {
            const external = href?.startsWith("http");
            return (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              >
                {linkChildren}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});
