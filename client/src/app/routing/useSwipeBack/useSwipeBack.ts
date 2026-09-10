import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SWIPE_START_EDGE_PX = 40;
const SWIPE_TRIGGER_DISTANCE_PX = 80;
const SWIPE_DIRECTION_RATIO = 1.5;

export const useSwipeBack = (): void => {
  const navigate = useNavigate();

  useEffect(() => {
    const mobileQuery = window.matchMedia('(pointer: coarse)');
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (event: TouchEvent): void => {
      if (!mobileQuery.matches || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch || touch.clientX > SWIPE_START_EDGE_PX) return;
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleTouchEnd = (event: TouchEvent): void => {
      if (!mobileQuery.matches || startX === 0) return;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);
      startX = 0;

      if (
        deltaX >= SWIPE_TRIGGER_DISTANCE_PX &&
        deltaX > deltaY * SWIPE_DIRECTION_RATIO
      ) {
        navigate(-1);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate]);
};
