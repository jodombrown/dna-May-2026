/**
 * /dna/dia now opens the global DIA sheet and sends the user back where they
 * were. DIA lives in a right-side sheet, not on a dedicated page.
 */
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDiaSheet } from '@/contexts/DiaSheetContext';

export default function DiaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { openWith } = useDiaSheet();

  useEffect(() => {
    const q = params.get('q') ?? undefined;
    openWith(q);
    navigate('/dna/feed', { replace: true });
  }, [navigate, openWith, params]);

  return null;
}
