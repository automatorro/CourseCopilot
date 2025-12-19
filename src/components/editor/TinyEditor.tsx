import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { uploadEditorImageToSupabase } from '../../lib/editorImageUpload';
import { useAuth } from '../../contexts/AuthContext';

export type TinyEditorProps = {
  value: string;
  onChange: (html: string) => void;
  refreshSignal?: number;
  onSelectionChange?: (text: string) => void;
};



const TinyEditor: React.FC<TinyEditorProps> = ({ value, onChange, refreshSignal, onSelectionChange }) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const isLocalChangeRef = useRef<boolean>(false);
  const [editorHeight, setEditorHeight] = useState<number>(520);

  useEffect(() => {
    const calc = () => {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;
      const actions = document.getElementById('workspace-actions') || document.getElementById('mobile-actions-bar');
      const actionsH = actions ? actions.getBoundingClientRect().height : 0;
      const available = Math.max(320, Math.floor(window.innerHeight - top - actionsH - 24));
      setEditorHeight(available);
    };
    calc();
    // Use a small delay to ensure layout is settled
    const timer = setTimeout(calc, 100);
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('resize', calc);
      clearTimeout(timer);
    };
  }, []);

  const initConfig = useMemo(() => ({
    menubar: false,
    base_url: '/tinymce',
    suffix: '.min',
    promotion: false,
    plugins: [
      'lists',
      'link',
      'image',
      'autoresize',
    ],
    toolbar:
      'undo redo | bold italic underline | blocks | bullist numlist | link image',
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2',
    branding: false,
    statusbar: true,
    resize: false,
    // Disable JS sticky to rely on CSS sticky for reliable scrolling inside custom container
    toolbar_sticky: false,
    content_style: 'html{scroll-padding-top:calc(var(--editor-header-h,60px) + var(--editor-tabs-h,48px) + 8px);} body{padding-bottom:240px;}',
    autoresize_bottom_margin: 240,
    paste_data_images: true,
    images_upload_handler: async (blobInfo: any) => {
      try {
        const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type });
        const url = await uploadEditorImageToSupabase(file, user?.id);
        return url;
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(err.message || 'Image upload failed');
        }
        throw new Error('Image upload failed');
      }
    },
    setup: (editor: any) => {
      editor.on('SelectionChange', () => {
        const text = editor.selection?.getContent({ format: 'text' }) || '';
        onSelectionChange?.(text);
      });
      editor.on('MouseUp', () => {
        const text = editor.selection?.getContent({ format: 'text' }) || '';
        onSelectionChange?.(text);
      });
      editor.on('KeyUp', () => {
        const text = editor.selection?.getContent({ format: 'text' }) || '';
        onSelectionChange?.(text);
      });
    },
  }), [user?.id]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const nextHtml = value || '';
    const current = editor.getContent({ format: 'html' }) || '';
    if (nextHtml !== current) {
      editor.setContent(nextHtml || '');
      try {
        editor.selection?.setCursorLocation();
        editor.selection?.collapse(false);
      } catch { }
    }
    isLocalChangeRef.current = false;
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    const isHtml = /<[a-z][\s\S]*>/i.test(value || '');
    const nextHtml = isHtml ? (value || '') : (value || '');
    editorRef.current.setContent(nextHtml || '');
    try {
      editorRef.current.selection?.setCursorLocation();
      editorRef.current.selection?.collapse(false);
    } catch { }
    isLocalChangeRef.current = false;
  }, [refreshSignal]);

  // Use local self-hosted script to avoid API key requirements and warnings
  const scriptSrc = '/tinymce/tinymce.min.js';

  return (
    <div ref={containerRef} style={{ minHeight: editorHeight }}>
      <Editor
        tinymceScriptSrc={scriptSrc}
        value={value}
        onInit={(_evt, editor) => { editorRef.current = editor; editor.setContent(value || ''); try { editor.selection?.setCursorLocation(); editor.selection?.collapse(false); } catch { } }}
        onEditorChange={(content) => {
          isLocalChangeRef.current = true;
          onChange(content || '');
        }}
        init={initConfig}
      />
    </div>
  );
};

export default TinyEditor;
