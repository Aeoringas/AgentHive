import React, { createContext, useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";

export interface CanvasState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface HexCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  fitAll: (bounds?: { minX: number; minY: number; maxX: number; maxY: number }) => void;
}

export const CanvasContext = createContext<CanvasState>({
  panX: 0,
  panY: 0,
  zoom: 1,
});

interface HexCanvasProps {
  children: React.ReactNode;
  onStateChange?: (state: CanvasState) => void;
  initialPanX?: number;
  initialPanY?: number;
}

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2.0;

const HexCanvas = forwardRef<HexCanvasHandle, HexCanvasProps>(
  function HexCanvas({ children, onStateChange, initialPanX = 0, initialPanY = 0 }, ref) {
    const [panX, setPanX] = useState(initialPanX);
    const [panY, setPanY] = useState(initialPanY);
    const [zoom, setZoom] = useState(1);
    const [dragging, setDragging] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      zoomIn() {
        setZoom((prev) => {
          const newZoom = Math.min(ZOOM_MAX, +(prev + 0.1).toFixed(1));
          const el = containerRef.current;
          if (el) {
            const cx = el.clientWidth / 2;
            const cy = el.clientHeight / 2;
            const ratio = newZoom / prev;
            setPanX((p) => cx - ratio * (cx - p));
            setPanY((p) => cy - ratio * (cy - p));
          }
          return newZoom;
        });
      },
      zoomOut() {
        setZoom((prev) => {
          const newZoom = Math.max(ZOOM_MIN, +(prev - 0.1).toFixed(1));
          const el = containerRef.current;
          if (el) {
            const cx = el.clientWidth / 2;
            const cy = el.clientHeight / 2;
            const ratio = newZoom / prev;
            setPanX((p) => cx - ratio * (cx - p));
            setPanY((p) => cy - ratio * (cy - p));
          }
          return newZoom;
        });
      },
      zoomReset() {
        setZoom(1);
        setPanX(initialPanX);
        setPanY(initialPanY);
      },
      fitAll(bounds?: { minX: number; minY: number; maxX: number; maxY: number }) {
        const el = containerRef.current;
        if (!el || !bounds) return;
        const vw = el.clientWidth;
        const vh = el.clientHeight;
        const contentW = bounds.maxX - bounds.minX;
        const contentH = bounds.maxY - bounds.minY;
        const padding = 80;
        const newZoom = Math.min(
          ZOOM_MAX,
          Math.max(ZOOM_MIN, Math.min((vw - padding) / contentW, (vh - padding) / contentH))
        );
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        setZoom(newZoom);
        setPanX(vw / 2 - cx * newZoom);
        setPanY(vh / 2 - cy * newZoom);
      },
    }), [initialPanX, initialPanY]);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        setZoom((prev) => {
          const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev * factor));
          const ratio = newZoom / prev;
          setPanX((p) => mouseX - ratio * (mouseX - p));
          setPanY((p) => mouseY - ratio * (mouseY - p));
          return newZoom;
        });
      };
      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => el.removeEventListener("wheel", handleWheel);
    }, []);

    const startDrag = useCallback((clientX: number, clientY: number) => {
      setDragging(true);
      lastPos.current = { x: clientX, y: clientY };
    }, []);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 1) {
          e.preventDefault();
          startDrag(e.clientX, e.clientY);
          return;
        }
        if (e.button === 0) {
          const target = e.target as HTMLElement;
          if (target === containerRef.current || target === innerRef.current) {
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
          }
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

    return (
      <CanvasContext.Provider value={{ panX, panY, zoom }}>
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "calc(100vh - 48px)",
            overflow: "hidden",
            position: "relative",
            cursor: dragging ? "grabbing" : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={innerRef}
            style={{
              transformOrigin: "0 0",
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              width: "100%",
              height: "100%",
            }}
          >
            {children}
          </div>
        </div>
      </CanvasContext.Provider>
    );
  }
);

export default HexCanvas;
