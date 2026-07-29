import type { TiptapJson } from "@/types/service-provider";

export const PROFESSIONAL_OVERVIEW_SCHEMA_VERSION = 1;
export const PROFESSIONAL_OVERVIEW_MAX_CHARACTERS = 5000;
export const EMPTY_PROFESSIONAL_OVERVIEW: TiptapJson = { type: "doc", content: [] };

const containers = new Set(["doc", "paragraph", "bulletList", "orderedList", "listItem", "blockquote"]);
const leaves = new Set(["text", "horizontalRule", "hardBreak"]);
const simpleMarks = new Set(["bold", "italic", "underline", "strike"]);

export function sanitizeProfessionalOverview(input: unknown): TiptapJson {
  const sanitized = sanitizeNode(input, true);
  return sanitized?.type === "doc" ? sanitized : EMPTY_PROFESSIONAL_OVERVIEW;
}

function sanitizeNode(input: unknown, root = false): TiptapJson | null {
  if (!input || typeof input !== "object") return null;
  const node = input as TiptapJson;
  if (typeof node.type !== "string") return null;
  if (root && node.type !== "doc") return null;

  if (node.type === "text") {
    if (typeof node.text !== "string") return null;
    return { type: "text", text: node.text, marks: sanitizeMarks(node.marks) };
  }
  if (node.type === "heading") {
    const level = node.attrs?.level;
    if (level !== 2 && level !== 3) return null;
    return {
      type: "heading",
      attrs: { level, ...alignment(node.attrs) },
      content: sanitizeChildren(node.content),
    };
  }
  if (!containers.has(node.type) && !leaves.has(node.type)) return null;
  if (node.type === "horizontalRule" || node.type === "hardBreak") return { type: node.type };
  const result: TiptapJson = { type: node.type, content: sanitizeChildren(node.content) };
  if (node.type === "paragraph") result.attrs = alignment(node.attrs);
  return result;
}

function sanitizeChildren(content: unknown): TiptapJson[] {
  if (!Array.isArray(content)) return [];
  return content.map((node) => sanitizeNode(node)).filter((node): node is TiptapJson => !!node);
}

function sanitizeMarks(marks: unknown): TiptapJson["marks"] {
  if (!Array.isArray(marks)) return [];
  return marks.flatMap((mark) => {
    if (!mark || typeof mark !== "object") return [];
    const value = mark as { type?: unknown; attrs?: Record<string, unknown> };
    if (typeof value.type !== "string") return [];
    if (simpleMarks.has(value.type)) return [{ type: value.type }];
    if (value.type !== "link") return [];
    const href = typeof value.attrs?.href === "string" ? safeExternalUrl(value.attrs.href) : null;
    return href ? [{ type: "link", attrs: { href, target: "_blank", rel: "noopener noreferrer nofollow" } }] : [];
  });
}

function alignment(attrs?: Record<string, unknown>) {
  const textAlign = attrs?.textAlign;
  return textAlign === "left" || textAlign === "center" || textAlign === "right" || textAlign === "justify"
    ? { textAlign }
    : {};
}

export function safeExternalUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function professionalOverviewPlainText(document: TiptapJson) {
  const parts: string[] = [];
  walk(document, parts);
  return parts.join("").replace(/\n{3,}/g, "\n\n").trim();
}

function walk(node: TiptapJson, output: string[]) {
  if (node.type === "text") output.push(node.text ?? "");
  if (node.type === "hardBreak") output.push("\n");
  node.content?.forEach((child) => walk(child, output));
  if (["paragraph", "heading", "listItem", "blockquote", "horizontalRule"].includes(node.type)) output.push("\n");
}

export function sanitizePastedHtml(value: string) {
  if (typeof DOMParser === "undefined") return "";
  const parsed = new DOMParser().parseFromString(value, "text/html");
  parsed.querySelectorAll("script,style,iframe,object,embed,svg,video,audio,img").forEach((element) => element.remove());
  parsed.body.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      if (element.tagName === "A" && attribute.name.toLowerCase() === "href") {
        const safe = safeExternalUrl(attribute.value);
        if (safe) element.setAttribute("href", safe);
        else element.removeAttribute("href");
      } else {
        element.removeAttribute(attribute.name);
      }
    });
  });
  return parsed.body.innerHTML;
}
