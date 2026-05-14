/**
 * Messaging typography tokens — scoped to messaging surfaces only.
 * All Inter (no Lora inside chats — Lora stays for the page H1).
 * WhatsApp-grade rhythm: tight, readable, uniform.
 */
export const msgType = {
  // Inbox list
  listName: 'text-[15px] leading-[1.25] font-medium text-foreground',
  listNameUnread: 'text-[15px] leading-[1.25] font-semibold text-foreground',
  listPreview: 'text-[14px] leading-[1.35] text-muted-foreground',
  listPreviewUnread: 'text-[14px] leading-[1.35] text-foreground',
  listTime: 'text-[12px] leading-[1.25] text-muted-foreground',
  listTimeUnread: 'text-[12px] leading-[1.25] text-primary font-medium',

  // Chat header
  headerTitle: 'text-[16px] leading-[1.25] font-semibold text-foreground',
  headerSubtitle: 'text-[12px] leading-[1.25] text-muted-foreground',

  // Bubbles
  bubbleBody: 'text-[15px] leading-[1.35]',
  bubbleMeta: 'text-[11px] leading-[1.25] opacity-70',
  bubbleSender: 'text-[12px] leading-[1.25] font-medium',

  // Day separator
  daySeparator: 'text-[11px] leading-[1.25] font-medium tracking-wide uppercase',
} as const;
