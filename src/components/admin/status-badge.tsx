import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/_/g, ' ');

  switch (status.toLowerCase()) {
    case 'active':
    case 'published':
    case 'ready':
    case 'captured':
    case 'processed':
    case 'resolved':
      return <Badge variant="success" className="capitalize">{normalized}</Badge>;

    case 'draft':
    case 'pending':
    case 'waiting_for_student':
    case 'open':
    case 'created':
      return <Badge variant="gold" className="capitalize">{normalized}</Badge>;

    case 'in_review':
    case 'processing':
    case 'uploading':
    case 'in_progress':
      return <Badge variant="secondary" className="capitalize">{normalized}</Badge>;

    case 'suspended':
    case 'revoked':
    case 'failed':
    case 'errored':
    case 'cancelled':
    case 'expired':
    case 'inactive':
      return <Badge variant="destructive" className="capitalize">{normalized}</Badge>;

    case 'archived':
    case 'closed':
    default:
      return <Badge variant="neutral" className="capitalize">{normalized}</Badge>;
  }
}

