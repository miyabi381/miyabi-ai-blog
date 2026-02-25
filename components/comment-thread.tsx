"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { CommentForm } from "@/components/comment-form";
import { toJaDateTime } from "@/lib/format";

export type CommentNode = {
  id: number;
  postId: number;
  userId: number;
  parentCommentId: number | null;
  content: string;
  createdAt: string;
  authorName: string;
  authorAvatarUrl: string | null;
};

type CommentThreadProps = {
  postId: number;
  comments: CommentNode[];
  canReply: boolean;
};

type CommentWithChildren = CommentNode & {
  children: CommentWithChildren[];
};

function buildTree(comments: CommentNode[]) {
  const byId = new Map<number, CommentWithChildren>();
  const roots: CommentWithChildren[] = [];

  for (const comment of comments) {
    byId.set(comment.id, { ...comment, children: [] });
  }

  for (const comment of comments) {
    const node = byId.get(comment.id);
    if (!node) {
      continue;
    }
    if (!comment.parentCommentId) {
      roots.push(node);
      continue;
    }
    const parent = byId.get(comment.parentCommentId);
    if (!parent) {
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }

  return roots;
}

type CommentItemProps = {
  postId: number;
  node: CommentWithChildren;
  depth: number;
  canReply: boolean;
  replyingToId: number | null;
  onToggleReply: (commentId: number) => void;
  onCloseReply: () => void;
};

function CommentItem({ postId, node, depth, canReply, replyingToId, onToggleReply, onCloseReply }: CommentItemProps) {
  return (
    <article className="card p-4" style={{ marginLeft: `${Math.min(depth, 5) * 16}px` }}>
      <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
        <Avatar username={node.authorName} avatarUrl={node.authorAvatarUrl} size={28} />
        <Link href={`/profile/${node.authorName}`} className="font-medium hover:text-accent">
          @{node.authorName}
        </Link>
        <span>{toJaDateTime(node.createdAt)}</span>
      </div>

      <p className="whitespace-pre-wrap text-sm text-slate-800">{node.content}</p>

      {canReply ? (
        <button onClick={() => onToggleReply(node.id)} className="mt-3 text-sm font-semibold text-accent">
          {replyingToId === node.id ? "返信フォームを閉じる" : "返信する"}
        </button>
      ) : null}

      {canReply && replyingToId === node.id ? (
        <CommentForm postId={postId} parentCommentId={node.id} compact onSubmitted={onCloseReply} />
      ) : null}

      <div className="mt-3 space-y-3">
        {node.children.map((child) => (
          <CommentItem
            key={child.id}
            postId={postId}
            node={child}
            depth={depth + 1}
            canReply={canReply}
            replyingToId={replyingToId}
            onToggleReply={onToggleReply}
            onCloseReply={onCloseReply}
          />
        ))}
      </div>
    </article>
  );
}

export function CommentThread({ postId, comments, canReply }: CommentThreadProps) {
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const tree = useMemo(() => buildTree(comments), [comments]);

  if (tree.length === 0) {
    return <p className="card p-4 text-sm text-slate-600">まだコメントはありません。</p>;
  }

  return (
    <div className="space-y-3">
      {tree.map((node) => (
        <CommentItem
          key={node.id}
          postId={postId}
          node={node}
          depth={0}
          canReply={canReply}
          replyingToId={replyingToId}
          onToggleReply={(commentId) => setReplyingToId((current) => (current === commentId ? null : commentId))}
          onCloseReply={() => setReplyingToId(null)}
        />
      ))}
    </div>
  );
}
