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

const TINY_API_KEY: string = (import.meta as any).env?.VITE_TINYMCE_API_KEY || '';

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
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  const initConfig = useMemo(() => ({
    menubar: false,
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
    toolbar_sticky: false,
    content_style: 'body{padding-bottom:240px;}',
    autoresize_bottom_margin: 240,
    paste_data_images: true,
    images_upload_handler: async (blobInfo: any) => {
      try {
        const file = new File([blobInfo.blob()], blobInfo.filename(), { type: blobInfo.blob().type });
        const url = await uploadEditorImageToSupabase(file, user?.id);
        return url;
      } catch (err: any) {
        throw new Error(err?.message || 'Image upload failed');
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
    }
    isLocalChangeRef.current = false;
  }, [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    const isHtml = /<[a-z][\s\S]*>/i.test(value || '');
    const nextHtml = isHtml ? (value || '') : (value || '');
    editorRef.current.setContent(nextHtml || '');
    isLocalChangeRef.current = false;
  }, [refreshSignal]);
  return (
    <div ref={containerRef} style={{ minHeight: editorHeight }}>
    <Editor
      tinymceScriptSrc="/node_modules/tinymce/tinymce.min.js"
      apiKey={TINY_API_KEY}
      value={value}
      onInit={(_evt, editor) => { editorRef.current = editor; editor.setContent(value || ''); }}
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
