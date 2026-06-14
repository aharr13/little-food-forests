// src/components/Canvas/CanvasDrawing.tsx
// This component ONLY handles drawing NEW polygon/line shapes
// All existing shapes are rendered by native Google Maps components in LayersScreen
import React, { useRef, useEffect, useState } from 'react';
import { FOOD_FOREST_LAYERS, Shape, Point, DrawingTool, Plant } from '../../types';

interface CanvasDrawingProps {
  map: google.maps.Map;
  selectedLayer: string | null;
  activeTool: DrawingTool;
  onShapeCreated: (shape: Shape) => void;
  disabled?: boolean;
  activePlant?: Plant | null;
}

export function CanvasDrawing({
  map,
  selectedLayer,
  activeTool,
  onShapeCreated,
  disabled = false,
  activePlant,
}: CanvasDrawingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);

  // Only show canvas when actively drawing polygon or line
  const shouldShowCanvas = (activeTool === 'polygon' || activeTool === 'line') && !disabled;

  // Setup canvas
  useEffect(() => {
    if (!canvasRef.current || !map || !shouldShowCanvas) return;

    const canvas = canvasRef.current;
    const mapDiv = map.getDiv();

    canvas.width = mapDiv.offsetWidth;
    canvas.height = mapDiv.offsetHeight;

    const listener = map.addListener('bounds_changed', () => {
      if (canvas.width !== mapDiv.offsetWidth || canvas.height !== mapDiv.offsetHeight) {
        canvas.width = mapDiv.offsetWidth;
        canvas.height = mapDiv.offsetHeight;
      }
      drawTempShape();
    });

    drawTempShape();

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, tempPoints, selectedLayer, activeTool, shouldShowCanvas]);

  // Reset when tool changes away from polygon/line
  useEffect(() => {
    if (activeTool !== 'polygon' && activeTool !== 'line') {
      setIsDrawingShape(false);
      setTempPoints([]);
    }
  }, [activeTool]);

  function latLngToPixel(latLng: Point): { x: number; y: number } | null {
    const projection = map.getProjection();
    if (!projection) return null;

    const bounds = map.getBounds();
    if (!bounds) return null;

    const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
    const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
    const point = projection.fromLatLngToPoint(new google.maps.LatLng(latLng.lat, latLng.lng));

    if (!topRight || !bottomLeft || !point) return null;

    const scale = Math.pow(2, map.getZoom() || 0);
    return {
      x: (point.x - bottomLeft.x) * scale,
      y: (point.y - topRight.y) * scale,
    };
  }

  function pixelToLatLng(x: number, y: number): Point | null {
    const projection = map.getProjection();
    const bounds = map.getBounds();
    if (!projection || !bounds) return null;

    const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
    const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
    if (!topRight || !bottomLeft) return null;

    const scale = Math.pow(2, map.getZoom() || 0);
    const worldPoint = new google.maps.Point(
      x / scale + bottomLeft.x,
      y / scale + topRight.y
    );

    const latLng = projection.fromPointToLatLng(worldPoint);
    if (!latLng) return null;

    return { lat: latLng.lat(), lng: latLng.lng() };
  }

  function drawTempShape() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isDrawingShape || tempPoints.length === 0) return;

    const layer = FOOD_FOREST_LAYERS.find(l => l.id === selectedLayer);
    if (!layer) return;

    const color = layer.color;

    ctx.beginPath();
    tempPoints.forEach((point, index) => {
      const pixel = latLngToPixel(point);
      if (!pixel) return;
      if (index === 0) {
        ctx.moveTo(pixel.x, pixel.y);
      } else {
        ctx.lineTo(pixel.x, pixel.y);
      }
    });

    if (activeTool === 'polygon' && tempPoints.length > 2) {
      ctx.closePath();
      ctx.fillStyle = color + '25';
      ctx.fill();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw points
    tempPoints.forEach((point, index) => {
      const pixel = latLngToPixel(point);
      if (!pixel) return;
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, index === 0 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = index === 0 ? '#fbbf24' : color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Close indicator for polygon
    if (activeTool === 'polygon' && tempPoints.length >= 3) {
      const firstPixel = latLngToPixel(tempPoints[0]);
      if (firstPixel) {
        ctx.beginPath();
        ctx.arc(firstPixel.x, firstPixel.y, 20, 0, 2 * Math.PI);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText('Click to close', firstPixel.x, firstPixel.y - 28);
      }
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !selectedLayer) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const latLng = pixelToLatLng(x, y);
    if (!latLng) return;

    if (activeTool === 'line') {
      if (!isDrawingShape) {
        setIsDrawingShape(true);
        setTempPoints([latLng]);
      } else if (tempPoints.length === 1) {
        // Complete line
        const newShape: Shape = {
          id: `shape_${Date.now()}_${Math.random()}`,
          layerId: selectedLayer,
          type: 'line',
          points: [...tempPoints, latLng],
          ...(activePlant && {
            plantId: activePlant.id,
            plantName: activePlant.commonName,
            plantScientificName: activePlant.scientificName,
          }),
        };
        onShapeCreated(newShape);
        setIsDrawingShape(false);
        setTempPoints([]);
      }
    } else if (activeTool === 'polygon') {
      if (!isDrawingShape) {
        setIsDrawingShape(true);
        setTempPoints([latLng]);
      } else {
        // Check if closing polygon
        if (tempPoints.length >= 3) {
          const firstPixel = latLngToPixel(tempPoints[0]);
          if (firstPixel && Math.sqrt(Math.pow(x - firstPixel.x, 2) + Math.pow(y - firstPixel.y, 2)) <= 20) {
            finishPolygon();
            return;
          }
        }
        setTempPoints([...tempPoints, latLng]);
      }
    }
  }

  function finishPolygon() {
    if (tempPoints.length >= 3 && selectedLayer) {
      const newShape: Shape = {
        id: `shape_${Date.now()}_${Math.random()}`,
        layerId: selectedLayer,
        type: 'polygon',
        points: tempPoints,
        ...(activePlant && {
          plantId: activePlant.id,
          plantName: activePlant.commonName,
          plantScientificName: activePlant.scientificName,
        }),
      };
      onShapeCreated(newShape);
    }
    setIsDrawingShape(false);
    setTempPoints([]);
  }

  function cancelDrawing() {
    setIsDrawingShape(false);
    setTempPoints([]);
  }

  if (!shouldShowCanvas) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onDoubleClick={() => {
          if (activeTool === 'polygon' && tempPoints.length >= 3) {
            finishPolygon();
          }
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'crosshair',
          pointerEvents: 'auto',
        }}
      />

      {isDrawingShape && tempPoints.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <span style={{ fontSize: '0.9rem', color: '#475569' }}>
            {activeTool === 'polygon'
              ? `${tempPoints.length} points • ${tempPoints.length >= 3 ? 'Click first point or' : 'Need 3+ points'}`
              : `${tempPoints.length}/2 points`}
          </span>
          {activeTool === 'polygon' && tempPoints.length >= 3 && (
            <button
              onClick={finishPolygon}
              style={{
                padding: '0.5rem 1rem',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Finish
            </button>
          )}
          <button
            onClick={cancelDrawing}
            style={{
              padding: '0.5rem 1rem',
              background: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
