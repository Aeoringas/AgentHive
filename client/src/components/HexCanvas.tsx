import React, { createContext, useCallback, useEffect, useRef, useState } from "react";

export interface CanvasState {
  panX: number;
  panY: number;
  zoom: number;
}

export const CanvasContext = createContext<CanvasState>({
  panX: 0,
  panY: 0,
  zoom: 1,
});

interface HexCanvasProps {
  children: React.ReactNode;
  onStateChange?: (state: CanvasState) => void;
}

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.0;

export default function HexCanvas({ children, onStateChange }: HexCanvasProps) {
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const spaceHeld = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * factor));
      const ratio = newZoom / zoom;
      setPanX((prev) => mouseX - ratio * (mouseX - prev));
      setPanY((prev) => mouseY - ratio * (mouseY - prev));
      setZoom(newZoom);
    },
    [zoom],
  );

  const startDrag = useCallback((clientX: number, clientY: number) => {
    setDragging(true);
    lastPos.current = { x: clientX, y: clientY };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && spaceHeld.current)) {
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
      }
    },
    [startDrag],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setPanX((prev) => prev + dx);
      setPanY((prev) => prev + dy);
    },
    [dragging],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    onStateChange?.({ panX, panY, zoom });
  }, [panX, panY, zoom, onStateChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      spaceHeld.current = true;
    }
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.code === "Space") {
      spaceHeld.current = false;
    }
  }, []);

  return (
    <CanvasContext.Provider value={{ panX, panY, zoom }}>
      <div
        ref={containerRef}
        tabIndex={0}
        style={{
          width: "100%",
          height: "calc(100vh - 48px)",
          overflow: "hidden",
          position: "relative",
          cursor: dragging ? "grabbing" : "default",
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      >
        <div
          style={{
            transformOrigin: "0 0",
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          }}
        >
          {children}
        </div>
      </div>
    </CanvasContext.Provider>
  );
}
