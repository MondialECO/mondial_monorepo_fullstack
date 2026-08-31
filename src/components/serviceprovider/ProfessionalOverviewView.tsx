import type { CSSProperties, ReactNode } from "react";
import { professionalOverviewPlainText, sanitizeProfessionalOverview } from "@/lib/service-provider/professional-overview";
import type { ProfessionalOverviewContent, TiptapJson } from "@/types/service-provider";

export function ProfessionalOverviewView({ content }: { content?: ProfessionalOverviewContent | any | null }) {
  const docRaw = content && typeof content === "object" && "document" in content ? content.document : content;
  const document = sanitizeProfessionalOverview(docRaw);
  const plainText =
    (content && typeof content === "object" && "plainText" in content && typeof content.plainText === "string"
      ? content.plainText.trim()
      : "") || professionalOverviewPlainText(document);
  if (!plainText) return null;
  const rendered = <div className="professional-overview text-sm leading-7 text-[#4B5563]">{renderNodes(document.content)}</div>;

  if (plainText.length <= 900) return rendered;
  return (
    <details className="group">
      <summary className="cursor-pointer list-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD] focus-visible:ring-offset-2">
        <p className="line-clamp-6 whitespace-pre-line text-sm leading-7 text-[#4B5563] group-open:hidden">{plainText}</p>
        <span className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#3C61DD] group-open:hidden">Show more</span>
        <span className="mt-3 hidden min-h-11 items-center text-sm font-semibold text-[#3C61DD] group-open:inline-flex">Show less</span>
      </summary>
      <div className="mt-2">{rendered}</div>
    </details>
  );
}

function renderNodes(nodes?: TiptapJson[]): ReactNode {
  return nodes?.map((node, index) => renderNode(node, `${node.type}-${index}`));
}

function renderNode(node: TiptapJson, key: string): ReactNode {
  if (node.type === "text") return <span key={key}>{applyMarks(node.text ?? "", node.marks)}</span>;
  if (node.type === "hardBreak") return <br key={key} />;
  if (node.type === "horizontalRule") return <hr key={key} />;
  const children = renderNodes(node.content);
  const style = alignmentStyle(node);
  switch (node.type) {
    case "paragraph": return <p key={key} style={style}>{children}</p>;
    case "heading": return node.attrs?.level === 3 ? <h3 key={key} style={style}>{children}</h3> : <h2 key={key} style={style}>{children}</h2>;
    case "bulletList": return <ul key={key}>{children}</ul>;
    case "orderedList": return <ol key={key}>{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "blockquote": return <blockquote key={key}>{children}</blockquote>;
    default: return <span key={key}>{children}</span>;
  }
}

function applyMarks(value: ReactNode, marks?: TiptapJson["marks"]) {
  return marks?.reduce<ReactNode>((child, mark, index) => {
    const key = `${mark.type}-${index}`;
    if (mark.type === "bold") return <strong key={key}>{child}</strong>;
    if (mark.type === "italic") return <em key={key}>{child}</em>;
    if (mark.type === "underline") return <u key={key}>{child}</u>;
    if (mark.type === "strike") return <s key={key}>{child}</s>;
    if (mark.type === "link" && typeof mark.attrs?.href === "string")
      return <a key={key} href={mark.attrs.href} target="_blank" rel="noopener noreferrer nofollow">{child}</a>;
    return child;
  }, value) ?? value;
}

function alignmentStyle(node: TiptapJson): CSSProperties | undefined {
  const value = node.attrs?.textAlign;
  return value === "left" || value === "center" || value === "right" || value === "justify" ? { textAlign: value } : undefined;
}
