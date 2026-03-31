import { useState, useRef, useCallback, useContext, useEffect } from 'react';
import { CanvasContext } from '../components/HexCanvas';
import { hexToPixel, pixelToHex } from '../utils/hex';
import type { HexCoord, Point } from '../utils/hex';

interface UseDragOptions {
  currentCoord: HexCoord;
  onDragEnd: (coord: HexCoord) => void;
}

interface UseDragResult {
  isDragging: boolean;
  dragOffset: Point | null;
  snapPreview: HexCoord | null;
  suppressTransition: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

const DRAG_THRESHOLD = 5;

export function useDrag(options: UseDragOptions): UseDragResult {
  const { zoom } = useContext(CanvasContext);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [suppressTransition, setSuppressTransition] = useState(false);

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const thresholdPassed = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const prevCoord = useRef(options.currentCoord);
  if (prevCoord.current.q !== options.currentCoord.q || prevCoord.current.r !== options.currentCoord.r) {
    prevCoord.current = options.currentCoord;
    if (dragOffset !== null) {
      setDragOffset(null);
    }
  }

  const snapPreview = (() => {
    if (!dragOffset) return null;
    const currentPixel = hexToPixel(options.currentCoord);
    return pixelToHex({
      x: currentPixel.x + dragOffset.x,
      y: currentPixel.y + dragOffset.y,
    });
  })();

  useEffect(() => {
    if (!suppressTransition) return;
    const id = requestAnimationFrame(() => setSuppressTransition(false));
    return () => cancelAnimationFrame(id);
  }, [suppressTransition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!startPos.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;

    if (!thresholdPassed.current) {
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      thresholdPassed.current = true;
      setIsDragging(true);
    }

    const z = zoomRef.current;
    setDragOffset({ x: dx / z, y: dy / z });
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);

    if (thresholdPassed.current) {
      const z = zoomRef.current;
      const dx = e.clientX - startPos.current!.x;
      const dy = e.clientY - startPos.current!.y;
      const offset = { x: dx / z, y: dy / z };
      const currentPixel = hexToPixel(optionsRef.current.currentCoord);
      const snapCoord = pixelToHex({
        x: currentPixel.x + offset.x,
        y: currentPixel.y + offset.y,
      });
      setSuppressTransition(true);
      optionsRef.current.onDragEnd(snapCoord);
    }

    startPos.current = null;
    thresholdPassed.current = false;
    setIsDragging(false);
    setDragOffset(null);
  }, [handleMouseMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    startPos.current = { x: e.clientX, y: e.clientY };
    thresholdPassed.current = false;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  return { isDragging, dragOffset, snapPreview, suppressTransition, handleMouseDown };
}
