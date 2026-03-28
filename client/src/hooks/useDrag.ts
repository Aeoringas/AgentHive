import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { CanvasContext } from "../components/HexCanvas";
import { hexToPixel, pixelToHex } from "../utils/hex";
import type { HexCoord, Point } from "../utils/hex";

interface UseDragOptions {
  currentCoord: HexCoord;
  onDragEnd: (coord: HexCoord) => void;
}

interface UseDragResult {
  isDragging: boolean;
  dragOffset: Point | null;
  handleMouseDown: (e: React.MouseEvent) => void;
}

const DRAG_THRESHOLD = 5;

export function useDrag(options: UseDragOptions): UseDragResult {
  const { zoom } = useContext(CanvasContext);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);

  const startPos = useRef<Point | null>(null);
  const active = useRef(false);
  const thresholdMet = useRef(false);
  const zoomRef = useRef(zoom);
  const optionsRef = useRef(options);

  zoomRef.current = zoom;
  optionsRef.current = options;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    startPos.current = { x: e.clientX, y: e.clientY };
    active.current = true;
    thresholdMet.current = false;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!active.current || !startPos.current) return;

      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;

      if (!thresholdMet.current) {
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        thresholdMet.current = true;
        setIsDragging(true);
      }

      setDragOffset({
        x: dx / zoomRef.current,
        y: dy / zoomRef.current,
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!active.current || !startPos.current) return;
      active.current = false;

      if (thresholdMet.current) {
        const dx = (e.clientX - startPos.current.x) / zoomRef.current;
        const dy = (e.clientY - startPos.current.y) / zoomRef.current;
        const base = hexToPixel(optionsRef.current.currentCoord);
        const coord = pixelToHex({ x: base.x + dx, y: base.y + dy });
        optionsRef.current.onDragEnd(coord);
      }

      setIsDragging(false);
      setDragOffset(null);
      startPos.current = null;
      thresholdMet.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return { isDragging, dragOffset, handleMouseDown };
}
