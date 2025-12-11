import { useRef, useState, useCallback, MouseEvent } from 'react';

export function useDraggableScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2; // Prędkość przewijania
    ref.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  return {
    ref,
    events: {
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onMouseMove,
    },
    isDragging,
  };
}