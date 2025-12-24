import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  onImageData?: (payload: { mime: string; size: number; dataUrl: string }) => void;
  /**
   * 当前活跃行（0-based）。用于外部目录等 UI 做高亮联动。
   */
  onActiveLineChange?: (lineIndex: number) => void;
}

export interface MarkdownEditorRef {
  scrollToLine: (lineIndex: number) => void;
}

export const MarkdownEditor = React.forwardRef<MarkdownEditorRef, MarkdownEditorProps>(({ value, onChange, onSave, onImageData, onActiveLineChange }, ref) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  // 暴露给父组件的方法
  React.useImperativeHandle(ref, () => ({
    scrollToLine: (lineIndex: number) => {
      const view = viewRef.current;
      if (!view) return;

      // CodeMirror 的 line 是 1-based，这里把外部 0-based lineIndex 转换。
      const totalLines = view.state.doc.lines;
      const safeLine = Math.min(Math.max(lineIndex + 1, 1), totalLines);
      const line = view.state.doc.line(safeLine);

      view.dispatch({
        effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
        selection: { anchor: line.from },
      });
      view.focus();
    }
  }));

  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onImageDataRef = useRef(onImageData);
  const onActiveLineChangeRef = useRef(onActiveLineChange);
  const initialValueRef = useRef(value);

  const lastActiveLineRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const emitActiveLine = (lineIndex: number) => {
    const next = Math.max(0, lineIndex);
    if (lastActiveLineRef.current === next) return;
    lastActiveLineRef.current = next;
    onActiveLineChangeRef.current?.(next);
  };

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onImageDataRef.current = onImageData;
  }, [onImageData]);

  useEffect(() => {
    onActiveLineChangeRef.current = onActiveLineChange;
  }, [onActiveLineChange]);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;

    const onUpdate = EditorView.updateListener.of((v: ViewUpdate) => {
      if (v.docChanged) {
        onChangeRef.current(v.state.doc.toString());
      }

      // selection/cursor 变化
      if (v.selectionSet) {
        const head = v.state.selection.main.head;
        const lineIndex = v.state.doc.lineAt(head).number - 1;
        emitActiveLine(lineIndex);
      }

      // 视口变化（滚动）
      if (v.viewportChanged) {
        const view = v.view;
        if (rafRef.current) {
          window.cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null;
          const topLineIndex = view.state.doc.lineAt(view.viewport.from).number - 1;
          emitActiveLine(topLineIndex);
        });
      }
    });

    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          onSaveRef.current?.();
          return true;
        },
      },
    ]);

    const MAX_IMG = 300 * 1024; // 300KB
    const insertAtCursor = (view: EditorView, text: string) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({ changes: { from, to, insert: text } });
      view.focus();
    };

    const readFileToDataURL = (file: File): Promise<string> => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // 处理图片上传（非 async 版本以符合 CodeMirror 类型要求）
    const handleImageFile = (f: File, view: EditorView): boolean => {
      if (!f.type.startsWith('image/')) return false;
      if (f.size > MAX_IMG) {
        alert('图片过大，单张上限 300KB');
        return true;
      }
      // 异步读取并插入
      readFileToDataURL(f).then((dataUrl) => {
        const alt = 'image';
        insertAtCursor(view, `![${alt}](${dataUrl})`);
        onImageDataRef.current?.({ mime: f.type, size: f.size, dataUrl });
      });
      return true; // 阻止默认行为
    };

    const handlers = EditorView.domEventHandlers({
      paste: (event, view) => {
        const files = event.clipboardData?.files;
        if (!files || !files.length) return false;
        return handleImageFile(files[0], view);
      },
      drop: (event, view) => {
        const files = event.dataTransfer?.files;
        if (!files || !files.length) return false;
        event.preventDefault(); // 阻止默认 drop 行为
        return handleImageFile(files[0], view);
      }
    });

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: [
        markdown({ base: markdownLanguage }),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        saveKeymap,
        onUpdate,
        handlers,
        EditorView.lineWrapping
      ]
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;

    // 初始化一次活跃行
    const initialHead = view.state.selection.main.head;
    emitActiveLine(view.state.doc.lineAt(initialHead).number - 1);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // 同步外部 value 变化
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value }
      });
    }
  }, [value]);

  const exec = (fn: (view: EditorView) => void) => {
    const view = viewRef.current;
    if (!view) return;
    fn(view);
    view.focus();
  };

  const wrapSelection = (before: string, after: string, placeholder: string) => {
    exec((view) => {
      const { from, to } = view.state.selection.main;
      const selected = view.state.doc.sliceString(from, to);
      const content = selected || placeholder;
      view.dispatch({
        changes: { from, to, insert: `${before}${content}${after}` },
        selection: { anchor: from + before.length, head: from + before.length + content.length },
      });
    });
  };

  const insertHeading = (level: 1 | 2 | 3) => {
    exec((view) => {
      const { from } = view.state.selection.main;
      const line = view.state.doc.lineAt(from);
      const prefix = `${'#'.repeat(level)} `;
      if (line.text.startsWith(prefix)) return;
      view.dispatch({ changes: { from: line.from, to: line.from, insert: prefix } });
    });
  };

  const insertCodeBlock = () => {
    exec((view) => {
      const { from, to } = view.state.selection.main;
      const selected = view.state.doc.sliceString(from, to);
      const body = selected || '';
      const block = `\n\n\`\`\`\n${body}\n\`\`\`\n\n`;
      view.dispatch({ changes: { from, to, insert: block } });
    });
  };

  const insertLink = () => {
    exec((view) => {
      const { from, to } = view.state.selection.main;
      const selected = view.state.doc.sliceString(from, to);
      const text = selected || '链接文本';
      const url = 'https://';
      const insert = `[${text}](${url})`;
      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + text.length + 3, head: from + insert.length - 1 },
      });
    });
  };

  return (
    <div className="rounded-md border border-slate-200 overflow-hidden">
      <div className="flex flex-wrap gap-2 px-2 py-2 bg-slate-50 border-b border-slate-200">
        <button type="button" className="px-2 py-1 text-xs rounded bg-white border hover:bg-slate-50" onClick={() => wrapSelection('**', '**', '加粗文本')}>B</button>
        <button type="button" className="px-2 py-1 text-xs rounded bg-white border hover:bg-slate-50" onClick={() => wrapSelection('*', '*', '斜体文本')}>I</button>
        <button type="button" className="px-2 py-1 text-xs rounded bg-white border hover:bg-slate-50" onClick={insertLink}>Link</button>
        <button type="button" className="px-2 py-1 text-xs rounded bg-white border hover:bg-slate-50" onClick={insertCodeBlock}>Code</button>
        <button type="button" className="px-2 py-1 text-xs rounded bg-white border hover:bg-slate-50" onClick={() => insertHeading(1)}>H1</button>
        <button type="button" className="px-2 py-1 text-xs rounded bg-white border hover:bg-slate-50" onClick={() => insertHeading(2)}>H2</button>
        <button type="button" className="px-2 py-1 text-xs rounded bg-white border hover:bg-slate-50" onClick={() => insertHeading(3)}>H3</button>
        <div className="ml-auto text-[11px] text-slate-400 self-center">Ctrl/Cmd + S 保存</div>
      </div>
      <div className="cm6-host min-h-[60vh]" ref={hostRef} />
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';
