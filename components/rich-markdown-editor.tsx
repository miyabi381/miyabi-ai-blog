"use client";

import { useMemo } from "react";
import { $createCodeNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { ListItemNode, ListNode, INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $convertFromMarkdownString, $convertToMarkdownString } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import {
  MarkdownShortcutPlugin,
  DEFAULT_TRANSFORMERS
} from "@lexical/react/LexicalMarkdownShortcutPlugin";
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
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND
} from "lexical";

type RichMarkdownEditorProps = {
  initialMarkdown: string;
  onChangeMarkdown: (markdown: string) => void;
};

function Toolbar() {
  const [editor] = useLexicalComposerContext();

  function setBlock(type: "paragraph" | "h2" | "h3" | "quote" | "code") {
    editor.update(() => {
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
    const url = window.prompt("リンクURLを入力してください", "https://");
    if (url === null) {
      return;
    }
    const trimmed = url.trim();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed === "" ? null : trimmed);
  }

  return (
    <div className="rt-toolbar">
      <button type="button" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>Undo</button>
      <button type="button" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>Redo</button>
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>B</button>
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>I</button>
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>U</button>
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}>S</button>
      <button type="button" onClick={toggleLink}>Link</button>
      <button type="button" onClick={() => setBlock("paragraph")}>P</button>
      <button type="button" onClick={() => setBlock("h2")}>H2</button>
      <button type="button" onClick={() => setBlock("h3")}>H3</button>
      <button type="button" onClick={() => setBlock("quote")}>Quote</button>
      <button type="button" onClick={() => setBlock("code")}>Code</button>
      <button type="button" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>List</button>
      <button type="button" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>1.</button>
      <button type="button" onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}>Task</button>
      <button type="button" onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}>HR</button>
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
        $convertFromMarkdownString(initialMarkdown, DEFAULT_TRANSFORMERS);
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
        <MarkdownShortcutPlugin transformers={DEFAULT_TRANSFORMERS} />
        <OnChangePlugin
          ignoreHistoryMergeTagChange
          onChange={(editorState) => {
            editorState.read(() => {
              onChangeMarkdown($convertToMarkdownString(DEFAULT_TRANSFORMERS));
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}
