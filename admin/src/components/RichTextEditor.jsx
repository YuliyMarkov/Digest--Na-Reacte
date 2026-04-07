import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

function RichTextEditor({ value, onChange, placeholder = "" }) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    const nextHtml = value || "<p></p>";

    if (currentHtml !== nextHtml) {
      editor.commands.setContent(nextHtml, false);
    }
  }, [editor, value]);

  if (!editor) return null;

  const openLinkModal = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    setIsLinkModalOpen(true);
  };

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setLinkUrl("");
  };

  const saveLink = () => {
    const url = linkUrl.trim();

    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      closeLinkModal();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();

    closeLinkModal();
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    closeLinkModal();
  };

  return (
    <>
      <div className="rich-editor">
        <div className="rich-editor-toolbar">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            I
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1. List
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkModal}
          >
            Link
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          >
            Clear
          </button>
        </div>

        <div className="rich-editor-field" data-placeholder={placeholder}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {isLinkModalOpen && (
        <div className="rich-editor-modal-overlay" onClick={closeLinkModal}>
          <div
            className="rich-editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Добавить ссылку</h3>

            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              autoFocus
            />

            <div className="rich-editor-modal-actions">
              <button type="button" onClick={saveLink}>
                Сохранить
              </button>

              <button
                type="button"
                className="secondary"
                onClick={closeLinkModal}
              >
                Отмена
              </button>

              <button
                type="button"
                className="danger"
                onClick={removeLink}
              >
                Удалить ссылку
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RichTextEditor;