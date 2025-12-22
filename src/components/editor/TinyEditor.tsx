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

  const initConfig = useMemo(() => ({
    menubar: false,
    base_url: '/tinymce',
    suffix: '.min',
    promotion: false,
    plugins: [
      'lists',
      'link',
      'image',
    ],
    toolbar:
      'undo redo | bold italic underline | blocks | bullist numlist | link image',
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2',
    branding: false,
    statusbar: false,
    resize: false,
    height: '100%',
    toolbar_sticky: false,
    toolbar_mode: 'sliding',
    content_style: 'body { font-family:Inter,sans-serif; font-size:16px; line-height:1.6; color:#1f2937; padding:20px; } html{scroll-padding-top:100px;}',
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
    <div ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
