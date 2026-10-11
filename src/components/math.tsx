import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
export function MathText({ children }: { children: string }) {
  return (
    <div className="math-content">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[[rehypeKatex, { trust: false, strict: "ignore" }]]}
        disallowedElements={["img"]}
        unwrapDisallowed
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
