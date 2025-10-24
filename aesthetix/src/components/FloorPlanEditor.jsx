import React, { useRef, useState } from "react";

const GRID_SIZE = 1; 
const INITIAL_VIEWBOX = { x: 0, y: 0, w: 20, h: 15 }; 

const FloorPlanEditor = ({ polygon, onPolygonChange }) => {
  const draggingIdx = useRef(null);
  const svgRef = useRef(null);
  const [viewBox, setViewBox] = useState(INITIAL_VIEWBOX);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const [addMode, setAddMode] = useState(false);

  // insert point on nearest edge or at end
  const handleAddPoint = (e) => {
    if (!addMode) return;
    const pt = getSvgCoords(e);
    // find closest edge to click
    let minDist = Infinity;
    let insertIdx = polygon.length;
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const dx = b.x - a.x, dy = b.y - a.y;
      const len2 = dx * dx + dy * dy;
      let t = len2 === 0 ? 0 : ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const proj = { x: a.x + t * dx, y: a.y + t * dy };
      const dist = Math.hypot(pt.x - proj.x, pt.y - proj.y);
      if (dist < minDist) {
        minDist = dist;
        insertIdx = i + 1;
      }
    }
    // insert if near edge, else append
    const newPt = { x: parseFloat(pt.x.toFixed(2)), y: parseFloat(pt.y.toFixed(2)) };
    let newPoly;
    if (minDist < 0.5 && polygon.length >= 2) {
      newPoly = [...polygon.slice(0, insertIdx), newPt, ...polygon.slice(insertIdx)];
    } else {
      newPoly = [...polygon, newPt];
    }
    onPolygonChange(newPoly);
  };

  // convert mouse coords to svg coords
  const getSvgCoords = (e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
    const y = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
    return { x, y };
  };

  // point dragging logic
  const handleMouseDown = (idx, e) => {
    e.stopPropagation();
    draggingIdx.current = idx;
    const move = (moveEvt) => {
      if (draggingIdx.current === null) return;
      const pt = getSvgCoords(moveEvt);
      const updated = polygon.map((pt0, i) =>
        i === draggingIdx.current ? { x: parseFloat(pt.x.toFixed(2)), y: parseFloat(pt.y.toFixed(2)) } : pt0
      );
      onPolygonChange(updated);
    };
    const up = () => {
      draggingIdx.current = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  // start panning svg
  const handlePanStart = (e) => {
    if (addMode || e.target.tagName === "circle" || e.button !== 0) return;
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      vx: viewBox.x,
      vy: viewBox.y,
    };
    document.body.style.userSelect = 'none';
    window.addEventListener("mousemove", handlePanMove);
    window.addEventListener("mouseup", handlePanEnd);
  };

  // move view during pan
  const handlePanMove = (e) => {
    if (!isPanning) return;
    const dx = ((e.clientX - panStart.current.x) / 480) * viewBox.w;
    const dy = ((e.clientY - panStart.current.y) / 320) * viewBox.h;
    setViewBox((vb) => ({ ...vb, x: panStart.current.vx - dx, y: panStart.current.vy - dy }));
  };

  // end panning
  const handlePanEnd = () => {
    setIsPanning(false);
    document.body.style.userSelect = '';
    window.removeEventListener("mousemove", handlePanMove);
    window.removeEventListener("mouseup", handlePanEnd);
  };

  // zoom logic
  const handleWheel = (e) => {
    e.preventDefault();
    const scale = e.deltaY < 0 ? 0.9 : 1.1;
    setViewBox((vb) => {
      const mx = vb.x + (e.nativeEvent.offsetX / 480) * vb.w;
      const my = vb.y + (e.nativeEvent.offsetY / 320) * vb.h;
      const newW = vb.w * scale;
      const newH = vb.h * scale;
      return {
        w: newW,
        h: newH,
        x: mx - ((mx - vb.x) * newW) / vb.w,
        y: my - ((my - vb.y) * newH) / vb.h,
      };
    });
  };

  // undo last point
  const handleUndo = () => {
    if (polygon.length > 0) {
      onPolygonChange(polygon.slice(0, -1));
    }
  };

  // draw grid 
  const gridLines = [];
  for (let x = Math.floor(viewBox.x); x < viewBox.x + viewBox.w; x += GRID_SIZE) {
    gridLines.push(
      <line
        key={"vx" + x}
        x1={x}
        y1={viewBox.y}
        x2={x}
        y2={viewBox.y + viewBox.h}
        stroke="#eee"
        strokeWidth={0.05}
      />
    );
  }
  for (let y = Math.floor(viewBox.y); y < viewBox.y + viewBox.h; y += GRID_SIZE) {
    gridLines.push(
      <line
        key={"vy" + y}
        x1={viewBox.x}
        y1={y}
        x2={viewBox.x + viewBox.w}
        y2={y}
        stroke="#eee"
        strokeWidth={0.05}
      />
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
        <button
          onClick={() => setAddMode((m) => !m)}
          style={{
            background: addMode ? "#1976d2" : "#fff",
            color: addMode ? "#fff" : "#1976d2",
            border: "1px solid #1976d2",
            borderRadius: 4,
            padding: "4px 12px",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          {addMode ? "Adding Points (Click to Pan)" : "Add Point"}
        </button>
        <button
          onClick={handleUndo}
          style={{
            background: "#fff",
            color: "#1976d2",
            border: "1px solid #1976d2",
            borderRadius: 4,
            padding: "4px 12px",
            cursor: polygon.length > 0 ? "pointer" : "not-allowed",
            fontWeight: 500,
            opacity: polygon.length > 0 ? 1 : 0.5,
          }}
          disabled={polygon.length === 0}
        >
          Undo
        </button>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="320"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        style={{
          border: "1px solid #ccc",
          background: "#fafafa",
          cursor: addMode ? "crosshair" : isPanning ? "move" : "default",
          marginBottom: 12,
          width: 480,
          height: 320,
        }}
        onClick={handleAddPoint}
        onMouseDown={handlePanStart}
        onWheel={handleWheel}
      >
        {/* draw grid */}
        {gridLines}
        {/* draw polygon */}
        <polygon
          points={polygon.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="#e0e0e0"
          stroke="#888"
          strokeWidth="0.08"
        />
        {/*draw points */}
        {polygon.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="0.18"
            fill="#1976d2"
            style={{ cursor: "pointer" }}
            onMouseDown={(e) => handleMouseDown(idx, e)}
          />
        ))}
        {/* draw wall lengths */}
        {polygon.map((p, idx) => {
          const next = polygon[(idx + 1) % polygon.length];
          const midX = (p.x + next.x) / 2;
          const midY = (p.y + next.y) / 2;
          const length = Math.sqrt((next.x - p.x) ** 2 + (next.y - p.y) ** 2).toFixed(2);
          return (
            <text
              key={"len" + idx}
              x={midX}
              y={midY - 0.2}
              fontSize="0.28"
              fill="#333"
              textAnchor="middle"
            >
              {length} m
            </text>
          );
        })}
      </svg>
      <div style={{ position: "absolute", right: 10, top: 10, background: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 13, border: "1px solid #eee" }}>
        <b>Scale:</b> 1 unit = 1 meter
      </div>
    </div>
  );
};

export default FloorPlanEditor;