'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { uploadService } from '../../../lib/api';
import './BlogEditor.css';

const MenuBar = ({ editor }) => {
  const addImage = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const res = await uploadService.image(file);
        editor.chain().focus().setImage({ src: res.data.url }).run();
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    };
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addYoutubeVideo = useCallback(() => {
    const url = prompt('Enter YouTube URL');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="blog-editor-toolbar">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''} title="Bold">
        <i className="fa-solid fa-bold" />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''} title="Italic">
        <i className="fa-solid fa-italic" />
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'active' : ''} title="Strikethrough">
        <i className="fa-solid fa-strikethrough" />
      </button>
      <div className="separator" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'active' : ''} title="Heading 2">
        H2
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'active' : ''} title="Heading 3">
        H3
      </button>
      <div className="separator" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''} title="Bullet List">
        <i className="fa-solid fa-list-ul" />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''} title="Numbered List">
        <i className="fa-solid fa-list-ol" />
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'active' : ''} title="Quote">
        <i className="fa-solid fa-quote-left" />
      </button>
      <div className="separator" />
      <button onClick={setLink} className={editor.isActive('link') ? 'active' : ''} title="Link">
        <i className="fa-solid fa-link" />
      </button>
      <button onClick={addImage} title="Insert Image">
        <i className="fa-solid fa-image" />
      </button>
      <button onClick={addYoutubeVideo} title="Embed YouTube Video">
        <i className="fa-brands fa-youtube" />
      </button>
      <div className="separator" />
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
        <i className="fa-solid fa-minus" />
      </button>
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <i className="fa-solid fa-rotate-left" />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <i className="fa-solid fa-rotate-right" />
      </button>
    </div>
  );
};

function BlogEditor({ content, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ HTMLAttributes: { class: 'blog-editor-image' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'blog-editor-link' } }),
      Youtube.configure({ width: 640, height: 360 }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => { onChange?.(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: 'blog-editor-content',
        'data-placeholder': placeholder || 'Write your blog post...',
      },
    },
  });

  return (
    <div className="blog-editor-wrapper">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export default BlogEditor;
