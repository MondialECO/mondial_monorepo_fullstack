"use client";

import { useRef } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PROFESSIONAL_OVERVIEW_MAX_CHARACTERS,
  professionalOverviewPlainText,
  safeExternalUrl,
  sanitizePastedHtml,
  sanitizeProfessionalOverview,
} from "@/lib/service-provider/professional-overview";
import type { TiptapJson } from "@/types/service-provider";
import { cn } from "@/lib/utils";

const placeholder = "Describe your expertise, working approach, industries, project experience and the value you provide to clients.";

export function ProfessionalOverviewEditor({
  value,
  onChange,
  error,
}: {
  value: TiptapJson;
  onChange: (value: TiptapJson, plainText: string) => void;
  error?: string | null;
}) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false, underline: false }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: false,
        protocols: ["http", "https"],
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
        isAllowedUri: (url) => !!safeExternalUrl(url),
      }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: PROFESSIONAL_OVERVIEW_MAX_CHARACTERS }),
    ],
    content: sanitizeProfessionalOverview(value) as JSONContent,
    editorProps: {
      attributes: {
        class: "tiptap min-h-64 rounded-b-xl bg-white px-4 py-4 text-sm leading-7 text-[#374151] outline-none",
        "aria-label": "Professional Overview editor",
        "aria-describedby": "professional-overview-help professional-overview-count professional-overview-error",
      },
      transformPastedHTML: sanitizePastedHtml,
    },
    onUpdate: ({ editor: updatedEditor }) => {
      const document = sanitizeProfessionalOverview(updatedEditor.getJSON());
      onChange(document, professionalOverviewPlainText(document));
    },
  });

  if (!editor) return <div className="h-72 animate-pulse rounded-xl border border-[#E5E7EB] bg-[#F4F5F7]" aria-label="Loading Professional Overview editor" />;

  const activeEditor = editor;
  const characters = activeEditor.storage.characterCount.characters();

  function setLink() {
    const existing = activeEditor.getAttributes("link").href as string | undefined;
    const entered = window.prompt("Enter a complete http(s) URL", existing ?? "https://");
    if (entered === null) return;
    if (!entered.trim()) {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const safe = safeExternalUrl(entered.trim());
    if (!safe) {
      window.alert("Links must use http or https.");
      return;
    }
    activeEditor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run();
  }

  function roveToolbar(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    const buttons = [...(toolbarRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
    if (!buttons.length) return;
    const current = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 :
      event.key === "ArrowRight" ? (current + 1) % buttons.length : (current - 1 + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  }

  return (
    <div>
      <label className="text-sm font-semibold text-[#171717]" onClick={() => editor.commands.focus()}>Professional Overview</label>
      <p id="professional-overview-help" className="mt-1 text-xs leading-5 text-[#6B7280]">
        Keep Bio concise; use this editor for your expertise, approach and project experience. Inline media and raw HTML are not supported.
      </p>
      <div className={cn("mt-3 overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-[#3C61DD] focus-within:ring-offset-2", error ? "border-[#B42318]" : "border-[#D1D5DB]")}>
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Professional Overview formatting"
          onKeyDown={roveToolbar}
          className="flex flex-wrap gap-1 border-b border-[#E5E7EB] bg-[#F9FAFB] p-2"
        >
          <Tool label="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow /></Tool>
          <Tool label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Tool>
          <Tool label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Tool>
          <Tool label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></Tool>
          <Tool label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></Tool>
          <Tool label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon /></Tool>
          <Tool label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough /></Tool>
          <Tool label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></Tool>
          <Tool label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></Tool>
          <Tool label="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></Tool>
          <Tool label="Link" active={editor.isActive("link")} onClick={setLink}><Link2 /></Tool>
          <Tool label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft /></Tool>
          <Tool label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter /></Tool>
          <Tool label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight /></Tool>
          <Tool label="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify /></Tool>
          <Tool label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus /></Tool>
          <Tool label="Undo" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></Tool>
          <Tool label="Redo" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></Tool>
          <Tool label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><Eraser /></Tool>
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-[#6B7280]">
        <span>Only supported formatting is retained when content is pasted.</span>
        <span id="professional-overview-count" className={characters >= PROFESSIONAL_OVERVIEW_MAX_CHARACTERS ? "font-semibold text-warning" : undefined} aria-live="polite">
          {characters.toLocaleString()}/{PROFESSIONAL_OVERVIEW_MAX_CHARACTERS.toLocaleString()} characters
        </span>
      </div>
      <p id="professional-overview-error" className="mt-2 text-sm text-[#B42318]" role={error ? "alert" : undefined}>{error}</p>
    </div>
  );
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-11 shrink-0 text-xs", active && "bg-[#E8ECFF] text-[#1F3FAF]")}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {typeof children === "string" ? children : <span className="[&>svg]:size-4">{children}</span>}
    </Button>
  );
}
