"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownKeymap } from "@codemirror/lang-markdown";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Annotation, EditorState } from "@codemirror/state";
import { drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, placeholder } from "@codemirror/view";

export type MarkdownEditorHandle = {
  focus: () => void;
  insertBlock: (text: string) => void;
  wrapSelection: (prefix: string, suffix: string, placeholderText: string) => void;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const externalUpdate = Annotation.define<boolean>();

function wrapSelection(view: EditorView, prefix: string, suffix: string, placeholderText: string) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to) || placeholderText;
  const inserted = `${prefix}${selected}${suffix}`;
  view.dispatch({
    changes: { from, to, insert: inserted },
    selection: { anchor: from + prefix.length, head: from + prefix.length + selected.length },
    scrollIntoView: true,
  });
  view.focus();
}

const editorTheme = EditorView.theme({
  "&": { minHeight: "620px", backgroundColor: "transparent", color: "var(--ink)", fontSize: "13px" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "1.85" },
  ".cm-content": { minHeight: "620px", padding: "24px 0", caretColor: "var(--accent)" },
  ".cm-line": { padding: "0 12px" },
  ".cm-gutters": { border: "0", backgroundColor: "transparent", color: "#b1b1ab" },
  ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "rgba(98, 87, 221, .055)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "rgba(98, 87, 221, .16)" },
});

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, Props>(function MarkdownEditor({ value, onChange }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValue = useRef(value);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: initialValue.current,
        extensions: [
          highlightSpecialChars(),
          history(),
          drawSelection(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          highlightSelectionMatches(),
          markdown(),
          EditorState.tabSize.of(2),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": "Markdown 正文", "aria-multiline": "true" }),
          placeholder("从这里开始写作。支持标题、列表、引用、链接、图片、表格和代码块。"),
          keymap.of([
            ...defaultKeymap,
            ...historyKeymap,
            ...markdownKeymap,
            ...searchKeymap,
            { key: "Mod-b", run: (target) => { wrapSelection(target, "**", "**", "加粗文字"); return true; } },
            { key: "Mod-i", run: (target) => { wrapSelection(target, "*", "*", "强调文字"); return true; } },
          ]),
          editorTheme,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !update.transactions.some((transaction) => transaction.annotation(externalUpdate))) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.state.doc.toString() === value) return;
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
      annotations: externalUpdate.of(true),
    });
  }, [value]);

  useImperativeHandle(ref, () => ({
    focus() {
      view.current?.focus();
    },
    wrapSelection(prefix, suffix, placeholderText) {
      if (view.current) wrapSelection(view.current, prefix, suffix, placeholderText);
    },
    insertBlock(text) {
      const editor = view.current;
      if (!editor) return;
      const cursor = editor.state.selection.main.head;
      const document = editor.state.doc.toString();
      const before = document.slice(0, cursor);
      const after = document.slice(cursor);
      const leading = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
      const trailing = after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "";
      const inserted = `${leading}${text}${trailing}`;
      editor.dispatch({ changes: { from: cursor, insert: inserted }, selection: { anchor: cursor + leading.length + text.length }, scrollIntoView: true });
      editor.focus();
    },
  }), []);

  return <div ref={host} className="codemirror-host" />;
});
