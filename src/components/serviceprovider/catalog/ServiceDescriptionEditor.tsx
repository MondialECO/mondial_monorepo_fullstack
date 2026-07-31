'use client';

import { useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  UnderlineIcon,
  Strikethrough,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sanitizePastedHtml, safeExternalUrl } from '@/lib/service-provider/professional-overview';

const MAX_CHARACTERS = 3000;
const placeholder = 'Explain the outcome, working approach, and what a client can expect.';

// Extract plain text from HTML for word counting
function getPlainText(html: string): string {
  if (!html) return '';
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!div) return html;
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function ServiceDescriptionEditor({
  value,
  onChange,
  error,
}: {
  value: string; // HTML string
  onChange: (html: string) => void;
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
        protocols: ['http', 'https'],
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
        isAllowedUri: (url) => !!safeExternalUrl(url),
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || undefined,
    editorProps: {
      attributes: {
        class: 'tiptap min-h-48 rounded-b-xl bg-white px-4 py-4 text-sm leading-7 text-muted-foreground outline-none',
        'aria-label': 'Service Description editor',
        'aria-describedby': 'service-description-help service-description-count service-description-error',
      },
      transformPastedHTML: sanitizePastedHtml,
    },
    onUpdate: ({ editor: updatedEditor }) => {
      const html = updatedEditor.getHTML();
      onChange(html);
    },
  });

  if (!editor) {
    return (
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted" aria-label="Loading Service Description editor" />
    );
  }

  const characterCount = value.length;
  const plainText = getPlainText(value);
  const wordCount = plainText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  function setLink() {
    const existing = editor.getAttributes('link').href as string | undefined;
    const entered = window.prompt('Enter a complete http(s) URL', existing ?? 'https://');
    if (entered === null) return;
    if (!entered.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const safe = safeExternalUrl(entered.trim());
    if (!safe) {
      window.alert('Links must use http or https.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: safe }).run();
  }

  function roveToolbar(event: React.KeyboardEvent<HTMLDivElement>) {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    )
      return;
    const buttons = [
      ...(toolbarRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
    ];
    if (!buttons.length) return;
    const current = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : event.key === 'ArrowRight'
            ? (current + 1) % buttons.length
            : (current - 1 + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  }

  return (
    <div>
      <label
        className="text-sm font-semibold text-foreground"
        onClick={() => editor.commands.focus()}
      >
        Service description
      </label>
      <p id="service-description-help" className="mt-1 text-xs leading-5 text-muted-foreground">
        Use formatting to highlight key aspects of your service. Minimum 120 words recommended.
      </p>
      <div
        className={cn(
          'mt-3 overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
          error ? 'border-[#B42318]' : 'border-[#D1D5DB]'
        )}
      >
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Service Description formatting"
          onKeyDown={roveToolbar}
          className="flex flex-wrap gap-1 border-b border-border bg-muted p-2"
        >
          <Tool
            label="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold />
          </Tool>
          <Tool
            label="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic />
          </Tool>
          <Tool
            label="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon />
          </Tool>
          <Tool
            label="Strikethrough"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough />
          </Tool>
          <div className="w-px bg-border" />
          <Tool
            label="Heading 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </Tool>
          <Tool
            label="Heading 3"
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </Tool>
          <div className="w-px bg-border" />
          <Tool
            label="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List />
          </Tool>
          <Tool
            label="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered />
          </Tool>
          <Tool
            label="Blockquote"
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote />
          </Tool>
          <Tool label="Link" active={editor.isActive('link')} onClick={setLink}>
            <Link2 />
          </Tool>
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {wordCount.toLocaleString()} words • {characterCount.toLocaleString()}/{MAX_CHARACTERS.toLocaleString()}{' '}
          characters
        </span>
      </div>
      <p
        id="service-description-error"
        className="mt-2 text-sm text-[#B42318]"
        role={error ? 'alert' : undefined}
      >
        {error}
      </p>
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
      size="sm"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0',
        active ? 'bg-border text-foreground' : 'text-muted-foreground hover:bg-[#F3F4F6] hover:text-muted-foreground'
      )}
    >
      {children}
    </Button>
  );
}
