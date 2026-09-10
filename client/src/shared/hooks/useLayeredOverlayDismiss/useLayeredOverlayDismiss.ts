import { useCallback, useState } from 'react';

interface UseLayeredOverlayDismissResult {
  readonly isChildOpen: boolean;
  readonly setChildOpen: (open: boolean) => void;
  readonly handleBackdropClick: () => void;
  readonly handleClose: () => void;
}

export const useLayeredOverlayDismiss = (
  onClose: () => void,
): UseLayeredOverlayDismissResult => {
  const [isChildOpen, setChildOpen] = useState(false);

  const handleClose = useCallback((): void => {
    setChildOpen(false);
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback((): void => {
    if (isChildOpen) {
      setChildOpen(false);
      return;
    }
    handleClose();
  }, [handleClose, isChildOpen]);

  return { isChildOpen, setChildOpen, handleBackdropClick, handleClose };
};
