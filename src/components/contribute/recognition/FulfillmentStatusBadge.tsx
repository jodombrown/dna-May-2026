/**
 * Status pill for fulfillments. Shared across NeedDetail, MyContributions,
 * and FulfillmentTracker so colors stay consistent.
 */
import React from 'react';
import { cn } from '@/lib/utils';
import type { FulfillmentStatus } from '@/services/contributeFulfillmentService';

interface FulfillmentStatusBadgeProps {
  status: FulfillmentStatus;
  className?: string;
}

const STATUS_LABEL: Record<FulfillmentStatus, string> = {
  pending: 'Awaiting acceptance',
  in_progress: 'In progress',
  fulfilled: 'Awaiting confirmation',
  confirmed: 'Asante given',
  cancelled: 'Cancelled',
};

const STATUS_STYLE: Record<FulfillmentStatus, string> = {
  pending: 'bg-[#B87333]/10 text-[#8a521e] border-[#B87333]/20',
  in_progress: 'bg-[#4A8D77]/10 text-[#2D6A4F] border-[#4A8D77]/20',
  fulfilled: 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/30',
  confirmed: 'bg-[#4A8D77]/15 text-[#2D6A4F] border-[#4A8D77]/40',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

export const FulfillmentStatusBadge: React.FC<FulfillmentStatusBadgeProps> = ({
  status,
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide border rounded-md',
      STATUS_STYLE[status],
      className
    )}
  >
    {STATUS_LABEL[status]}
  </span>
);

export default FulfillmentStatusBadge;
