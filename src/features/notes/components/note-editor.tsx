'use client';

import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  BoldIcon,
  CodeIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Same rule as the API: only web and email links. */
export const SAFE_LINK = /^(https?:\/\/|mailto:)/i;

/** "example.com" → "https://example.com"; anything unsafe → null. */
export function normalizeLink(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const withProtocol =
    SAFE_LINK.test(value) || value.includes(':') ? value : `https://${value}`;
  return SAFE_LINK.test(withProtocol) ? withProtocol : null;
}

function ToolbarButton({
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
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the cursor/selection in the editor when clicking a button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40',
        active && 'bg-lavender-soft text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function LinkForm({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const [value, setValue] = useState(
    (editor.getAttributes('link').href as string | undefined) ?? '',
  );
  const [error, setError] = useState('');

  return (
    <form
      className="flex flex-wrap items-center gap-2 border-t p-2"
      onSubmit={(e) => {
        e.preventDefault();
        const href = normalizeLink(value);
        if (!href) {
          setError('Use a web address (https://…) or an email (mailto:…).');
          return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
        onDone();
      }}
    >
      <label htmlFor="note-link" className="sr-only">
        Link address
      </label>
      <Input
        id="note-link"
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError('');
        }}
        placeholder="https://example.com"
        aria-invalid={!!error}
        aria-describedby={error ? 'note-link-error' : undefined}
        className="h-8 max-w-sm flex-1"
      />
      <Button type="submit" size="sm">
        Apply
      </Button>
      {editor.isActive('link') && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            onDone();
          }}
        >
          Remove link
        </Button>
      )}
      <Button type="button" size="sm" variant="ghost" onClick={onDone}>
        Cancel
      </Button>
      {error && (
        <p id="note-link-error" className="w-full text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linking, setLinking] = useState(false);
  // Re-render the toolbar only when what it shows changes.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      taskList: e.isActive('taskList'),
      blockquote: e.isActive('blockquote'),
      link: e.isActive('link'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div className="sticky top-0 z-10 rounded-t-xl border-b bg-card">
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-0.5 p-1.5"
      >
        <ToolbarButton
          label="Bold"
          active={state.bold}
          onClick={() => chain().toggleBold().run()}
        >
          <BoldIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={state.italic}
          onClick={() => chain().toggleItalic().run()}
        >
          <ItalicIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={state.underline}
          onClick={() => chain().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={state.strike}
          onClick={() => chain().toggleStrike().run()}
        >
          <StrikethroughIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Inline code"
          active={state.code}
          onClick={() => chain().toggleCode().run()}
        >
          <CodeIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton
          label="Heading"
          active={state.h2}
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Subheading"
          active={state.h3}
          onClick={() => chain().toggleHeading({ level: 3 }).run()}
        >
          <Heading3Icon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={state.bulletList}
          onClick={() => chain().toggleBulletList().run()}
        >
          <ListIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={state.orderedList}
          onClick={() => chain().toggleOrderedList().run()}
        >
          <ListOrderedIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Checklist"
          active={state.taskList}
          onClick={() => chain().toggleTaskList().run()}
        >
          <ListChecksIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={state.blockquote}
          onClick={() => chain().toggleBlockquote().run()}
        >
          <QuoteIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          active={state.link || linking}
          onClick={() => setLinking((v) => !v)}
        >
          <LinkIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <ToolbarButton
          label="Undo"
          disabled={!state.canUndo}
          onClick={() => chain().undo().run()}
        >
          <Undo2Icon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!state.canRedo}
          onClick={() => chain().redo().run()}
        >
          <Redo2Icon className="size-4" aria-hidden="true" />
        </ToolbarButton>
      </div>
      {linking && <LinkForm editor={editor} onDone={() => setLinking(false)} />}
    </div>
  );
}

interface NoteEditorProps {
  /** Only used when the editor starts; afterwards the editor owns the text. */
  initialContent: JSONContent;
  onChange: (content: JSONContent) => void;
}

/**
 * Rich-text editor (Tiptap). Content is JSON, saved by the API after it checks
 * every element; nothing is ever inserted into the page as raw HTML.
 */
export function NoteEditor({ initialContent, onChange }: NoteEditorProps) {
  const editor = useEditor({
    // Render on the client only (avoids a server/client mismatch).
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          isAllowedUri: (url) => SAFE_LINK.test(url),
          HTMLAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer nofollow',
          },
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'note-content min-h-[50vh] px-5 py-4 outline-none sm:px-8',
        'aria-label': 'Note text',
        'aria-multiline': 'true',
        role: 'textbox',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
  });

  if (!editor) {
    return (
      <Skeleton
        className="h-[50vh] w-full rounded-xl"
        aria-label="Loading editor"
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-xs focus-within:border-lavender">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
