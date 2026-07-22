import React from 'react';
import { linkifyContent } from '@/utils/linkifyContent';

/**
 * Split a single paragraph of long prose into ~3-sentence groups so long,
 * unbroken bodies render as readable paragraph blocks rather than a wall
 * of text. Only applied when the body is a single paragraph > 600 chars.
 */
export function toParagraphs(text: string, groupSize = 3): string[] {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];

  // If author already added paragraph breaks, respect them.
  const explicit = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (explicit.length > 1) return explicit;

  if (trimmed.length <= 600) return [trimmed];

  // Split into sentences, preserving trailing punctuation.
  const sentences = trimmed.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [trimmed];
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += groupSize) {
    groups.push(sentences.slice(i, i + groupSize).join('').trim());
  }
  return groups.filter(Boolean);
}

/**
 * Normalize prose content on write so long single-paragraph bodies get
 * paragraph breaks stored alongside the text, matching how existing rows
 * were normalized.
 */
export function normalizeProseContent(content: string): string {
  return toParagraphs(content).join('\n\n');
}

interface RenderProseProps {
  content: string;
  className?: string;
}

/**
 * Render prose content as a series of `<p>` blocks, each paragraph piped
 * through `linkifyContent` so URLs, mentions, and hashtags stay clickable.
 */
export function RenderProse({ content, className }: RenderProseProps) {
  const paragraphs = toParagraphs(content);
  if (paragraphs.length === 0) return null;

  return (
    <div className={className}>
      {paragraphs.map((para, i) => (
        <p key={i} className="whitespace-pre-line break-words mb-3 last:mb-0">
          {linkifyContent(para)}
        </p>
      ))}
    </div>
  );
}
