"use client";

import { useMemo } from "react";
import { $createCodeNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { ListItemNode, ListNode, INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $convertFromMarkdownString, $convertToMarkdownString, CHECK_LIST, TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { HorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  REDO_COMMAND,
  UNDO_COMMAND
} from "lexical";

type RichMarkdownEditorProps = {
  initialMarkdown: string;
  onChangeMarkdown: (markdown: string) => void;
};

const MARKDOWN_TRANSFORMERS = [CHECK_LIST, ...TRANSFORMERS];

function Toolbar() {
  const [editor] = useLexicalComposerContext();

  function resetPendingInlineFormat() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }
    selection.setFormat(0);
  }

  function withSelection(action: () => void) {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      action();
    });
  }

  function formatSelectionOnly(format: "bold" | "italic" | "underline" | "strikethrough") {
    withSelection(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        return;
      }
      selection.formatText(format);
      const endPoint = selection.isBackward() ? selection.anchor : selection.focus;
      selection.anchor.set(endPoint.key, endPoint.offset, endPoint.type);
      selection.focus.set(endPoint.key, endPoint.offset, endPoint.type);
      resetPendingInlineFormat();
    });
  }

  function setBlock(type: "paragraph" | "h2" | "h3" | "quote" | "code") {
    withSelection(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      if (type === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }
      if (type === "h2") {
        $setBlocksType(selection, () => $createHeadingNode("h2"));
        return;
      }
      if (type === "h3") {
        $setBlocksType(selection, () => $createHeadingNode("h3"));
        return;
      }
      if (type === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
        return;
      }
      $setBlocksType(selection, () => $createCodeNode());
    });
  }

  function toggleLink() {
    let hasSelectedText = false;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      hasSelectedText = Boolean($isRangeSelection(selection) && !selection.isCollapsed());
    });
    if (!hasSelectedText) {
      return;
    }

    const url = window.prompt("リンクURLを入力してください", "https://");
    if (url === null) {
      return;
    }
    const trimmed = url.trim();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed === "" ? null : trimmed);
  }

  return (
    <div
      className="rt-toolbar"
      onMouseDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) {
          event.preventDefault();
        }
      }}
    >
      <button type="button" title="元に戻す" aria-label="元に戻す" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>Undo</button>
      <button type="button" title="やり直す" aria-label="やり直す" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>Redo</button>
      <button type="button" title="太字（選択文字に適用）" aria-label="太字（選択文字に適用）" onClick={() => formatSelectionOnly("bold")}>B</button>
      <button type="button" title="斜体（選択文字に適用）" aria-label="斜体（選択文字に適用）" onClick={() => formatSelectionOnly("italic")}>I</button>
      <button type="button" title="下線（選択文字に適用）" aria-label="下線（選択文字に適用）" onClick={() => formatSelectionOnly("underline")}>U</button>
      <button type="button" title="打ち消し線（選択文字に適用）" aria-label="打ち消し線（選択文字に適用）" onClick={() => formatSelectionOnly("strikethrough")}>S</button>
      <button type="button" title="リンク（選択文字に適用）" aria-label="リンク（選択文字に適用）" onClick={toggleLink}>Link</button>
      <button type="button" title="通常段落" aria-label="通常段落" onClick={() => setBlock("paragraph")}>P</button>
      <button type="button" title="見出し2" aria-label="見出し2" onClick={() => setBlock("h2")}>H2</button>
      <button type="button" title="見出し3" aria-label="見出し3" onClick={() => setBlock("h3")}>H3</button>
      <button type="button" title="引用ブロック" aria-label="引用ブロック" onClick={() => setBlock("quote")}>Quote</button>
      <button type="button" title="コードブロック" aria-label="コードブロック" onClick={() => setBlock("code")}>Code</button>
      <button type="button" title="箇条書きリスト" aria-label="箇条書きリスト" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>List</button>
      <button type="button" title="番号付きリスト" aria-label="番号付きリスト" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>1.</button>
      <button type="button" title="チェックリスト" aria-label="チェックリスト" onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}>Task</button>
      <button type="button" title="仕切り線" aria-label="仕切り線" onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}>HR</button>
    </div>
  );
}

export function RichMarkdownEditor({ initialMarkdown, onChangeMarkdown }: RichMarkdownEditorProps) {
  const initialConfig = useMemo(
    () => ({
      namespace: "miyabi-rich-editor",
      onError: (error: Error) => {
        throw error;
      },
      theme: {
        paragraph: "rt-paragraph",
        quote: "rt-quote",
        heading: {
          h1: "rt-h1",
          h2: "rt-h2",
          h3: "rt-h3"
        },
        list: {
          ul: "rt-ul",
          ol: "rt-ol",
          listitem: "rt-li",
          nested: {
            listitem: "rt-li-nested"
          },
          listitemChecked: "rt-li-checked",
          listitemUnchecked: "rt-li-unchecked"
        },
        text: {
          bold: "rt-bold",
          italic: "rt-italic",
          underline: "rt-underline",
          strikethrough: "rt-strike",
          code: "rt-inline-code"
        }
      },
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode, AutoLinkNode, HorizontalRuleNode],
      editorState: () => {
        $convertFromMarkdownString(initialMarkdown, MARKDOWN_TRANSFORMERS);
      }
    }),
    [initialMarkdown]
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="rt-shell">
        <Toolbar />
        <RichTextPlugin
          contentEditable={<ContentEditable className="rt-editor markdown-body" />}
          placeholder={<p className="rt-placeholder">本文を入力してください</p>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <HorizontalRulePlugin />
        <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
        <OnChangePlugin
          ignoreHistoryMergeTagChange
          onChange={(editorState) => {
            editorState.read(() => {
              onChangeMarkdown($convertToMarkdownString(MARKDOWN_TRANSFORMERS));
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}
