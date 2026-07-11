/**
 * DiaSheetMount — lazy-loads the DIA sheet only after it has been opened
 * at least once. Keeps the sheet's dependencies out of the initial bundle.
 */
import React, { Suspense, lazy } from 'react';
import { useDiaSheet } from '@/contexts/DiaSheetContext';

const DiaSheet = lazy(() => import('./DiaSheet'));

const DiaSheetMount: React.FC = () => {
  const { open } = useDiaSheet();
  const [hasOpened, setHasOpened] = React.useState(false);

  React.useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  if (!hasOpened) return null;
  return (
    <Suspense fallback={null}>
      <DiaSheet />
    </Suspense>
  );
};

export default DiaSheetMount;
