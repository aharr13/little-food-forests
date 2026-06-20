// src/components/Canvas/LayersScreen.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Circle as LeafletCircle, Polygon as LeafletPolygon, Polyline as LeafletPolyline, Marker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Circle, Minus as Line, Pentagon as PolygonIcon,
  Eye, EyeOff, Trash2, ZoomIn, ZoomOut, Maximize2,
  Camera, ArrowLeft, MousePointer2, Droplets, Layers, Home,
  Leaf, X, Map, Satellite, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';
import { FOOD_FOREST_LAYERS, Shape, DrawingTool, LayerVisibility, WaterFeature, WaterFeatureType, WATER_FEATURE_TYPES, Plant, Point, PlantStatus, ConversationMessage, RejectedPlant } from '../../types';
import { PlantRecommendation, PlacementSuggestion } from '../Consultation/ConsultationScreen';
import { LayerWizard } from './LayerWizard';
import { GroundcoverSelector } from './GroundcoverSelector';
import { WaterTopography } from './WaterTopography';
import { PlantSearch } from '../Plants/PlantSearch';
import { GuildAnalysis } from '../Plants/GuildAnalysis';
import { usePlants } from '../../hooks/usePlants';
import { SnapshotGallery } from './SnapshotGallery';
import './LayersScreen.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LayersScreenProps {
  projectId: string;
  mapCenter: { lat: number; lng: number };
  boundaryPoints: { lat: number; lng: number }[];
  shapes: Shape[];
  onShapesChange: (shapes: Shape[]) => void;
  groundcoverSpecies: string[];
  onGroundcoverSpeciesChange: (species: string[]) => void;
  waterFeatures: WaterFeature[];
  onWaterFeaturesChange: (features: WaterFeature[]) => void;
  onBackToDashboard: () => void;
  onOpenConsultation: (followUpPlantName?: string) => void;
  onOpenPlanning: () => void;
  onShapePlanted: (shape: Shape) => void;
  pendingRecommendations: PlantRecommendation[];
  onClearRecommendations: () => void;
  placementSuggestion: PlacementSuggestion | null;
  onClearPlacement: () => void;
  consultationHistory?: ConversationMessage[];
  onSaveConsultationHistory?: (messages: ConversationMessage[]) => void;
  rejectedPlants?: RejectedPlant[];
  onSaveRejectedPlants?: (rejected: RejectedPlant[]) => void;
}

// Component to handle map events and expose map instance
function MapController({
  onMapReady,
  activeTool,
  selectedLayerId,
  sidebarMode,
  activeWaterTool,
  waterSelectMode,
  activePlant,
  onMapClick,
  drawingState,
  setDrawingState,
  onShapeCreated,
  onZoomChange,
  onDeselectWaterFeature,
}: {
  onMapReady: (map: L.Map) => void;
  activeTool: DrawingTool;
  selectedLayerId: string | null;
  sidebarMode: 'layers' | 'water';
  activeWaterTool: WaterFeatureType | null;
  waterSelectMode: boolean;
  activePlant: Plant | null;
  onMapClick: (latlng: L.LatLng) => void;
  drawingState: { isDrawing: boolean; points: Point[] };
  setDrawingState: (state: { isDrawing: boolean; points: Point[] }) => void;
  onShapeCreated: (shape: Shape) => void;
  onZoomChange: (zoom: number) => void;
  onDeselectWaterFeature: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  // Track zoom level changes
  useEffect(() => {
    const handleZoomEnd = () => {
      onZoomChange(map.getZoom());
    };
    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomChange]);

  // Convert scroll wheel to pan (two-finger scroll pans the map)
  useEffect(() => {
    const container = map.getContainer();

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Pan the map based on scroll delta
      map.panBy([e.deltaX, e.deltaY], { animate: false });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [map]);

  useMapEvents({
    click: (e) => {
      // Handle water tool placement
      if (sidebarMode === 'water' && activeWaterTool) {
        onMapClick(e.latlng);
        return;
      }

      // In water select mode, clicking empty area deselects
      if (sidebarMode === 'water' && waterSelectMode) {
        onDeselectWaterFeature();
        return;
      }

      // Handle circle tool
      if (activeTool === 'circle' && selectedLayerId && sidebarMode === 'layers') {
        onMapClick(e.latlng);
        return;
      }

      // Handle polygon/line drawing
      if ((activeTool === 'polygon' || activeTool === 'line') && selectedLayerId && sidebarMode === 'layers') {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };

        if (activeTool === 'line') {
          if (!drawingState.isDrawing) {
            setDrawingState({ isDrawing: true, points: [newPoint] });
          } else if (drawingState.points.length === 1) {
            // Complete line
            const newShape: Shape = {
              id: `shape_${Date.now()}_${Math.random()}`,
              layerId: selectedLayerId,
              type: 'line',
              points: [...drawingState.points, newPoint],
              ...(activePlant && {
                plantId: activePlant.id,
                plantName: activePlant.commonName,
                plantScientificName: activePlant.scientificName,
              }),
            };
            onShapeCreated(newShape);
            setDrawingState({ isDrawing: false, points: [] });
          }
        } else if (activeTool === 'polygon') {
          if (!drawingState.isDrawing) {
            setDrawingState({ isDrawing: true, points: [newPoint] });
          } else {
            // Just add points - closing is handled by clicking the first point marker
            setDrawingState({ isDrawing: true, points: [...drawingState.points, newPoint] });
          }
        }
        return;
      }

      // Select mode - click empty area (handled by shapes' onClick not firing)
    },
    dblclick: (e) => {
      // Double-click to finish polygon with 3+ points
      if (activeTool === 'polygon' && drawingState.isDrawing && drawingState.points.length >= 3 && selectedLayerId) {
        e.originalEvent.preventDefault();
        const newShape: Shape = {
          id: `shape_${Date.now()}_${Math.random()}`,
          layerId: selectedLayerId,
          type: 'polygon',
          points: drawingState.points,
          ...(activePlant && {
            plantId: activePlant.id,
            plantName: activePlant.commonName,
            plantScientificName: activePlant.scientificName,
          }),
        };
        onShapeCreated(newShape);
        setDrawingState({ isDrawing: false, points: [] });
      }
    },
  });

  return null;
}

// Interactive circle component with drag and resize
// For trees (canopy/understory), shows both trunk and canopy circles
function EditableCircle({
  shape,
  layer,
  isSelected,
  isVisible,
  activeTool,
  onSelect,
  onUpdate,
}: {
  shape: Shape;
  layer: typeof FOOD_FOREST_LAYERS[0];
  isSelected: boolean;
  isVisible: boolean;
  activeTool: DrawingTool;
  onSelect: () => void;
  onUpdate: (updates: Partial<Shape>) => void;
}) {
  const canopyRef = useRef<L.Circle | null>(null);
  const trunkRef = useRef<L.Circle | null>(null);
  const map = useMap();

  if (!shape.center || !isVisible) return null;

  const isTree = shape.layerId === 'canopy' || shape.layerId === 'understory';
  const canopyRadiusMeters = (shape.canopyRadius || 5) * 0.3048;
  const trunkRadiusMeters = (shape.radius || (isTree ? 1 : 0)) * 0.3048;
  const status = shape.status || 'planned';
  const statusDash = status === 'planned' ? '8, 6' : status === 'establishing' ? '3, 4' : undefined;
  const statusOpacity = status === 'planned' ? 0.25 : status === 'establishing' ? 0.35 : 0.45;

  return (
    <>
      {/* Canopy/shade circle (larger, semi-transparent) */}
      <LeafletCircle
        ref={canopyRef}
        center={[shape.center.lat, shape.center.lng]}
        radius={canopyRadiusMeters}
        pathOptions={{
          fillColor: layer.color,
          fillOpacity: isSelected ? 0.55 : statusOpacity,
          color: isSelected ? '#fbbf24' : layer.color,
          weight: isSelected ? 3 : status === 'established' ? 2 : 1,
          dashArray: isSelected ? undefined : statusDash ?? (isTree ? '4, 4' : undefined),
        }}
        eventHandlers={{
          click: (e) => {
            // Only handle clicks in select mode - let drawing mode clicks pass through
            if (activeTool === 'select') {
              L.DomEvent.stopPropagation(e);
              onSelect();
            }
            // In drawing mode, don't stop propagation - let map handle the click
          },
          mousedown: (e) => {
            if (!isSelected) return;
            L.DomEvent.stopPropagation(e);

            const startLatLng = e.latlng;
            const startCenter = shape.center!;

            const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
              const deltaLat = moveEvent.latlng.lat - startLatLng.lat;
              const deltaLng = moveEvent.latlng.lng - startLatLng.lng;
              const newCenter = {
                lat: startCenter.lat + deltaLat,
                lng: startCenter.lng + deltaLng,
              };
              if (canopyRef.current) {
                canopyRef.current.setLatLng([newCenter.lat, newCenter.lng]);
              }
              if (trunkRef.current) {
                trunkRef.current.setLatLng([newCenter.lat, newCenter.lng]);
              }
            };

            const onMouseUp = (upEvent: L.LeafletMouseEvent) => {
              map.off('mousemove', onMouseMove);
              map.off('mouseup', onMouseUp);
              map.dragging.enable();

              const deltaLat = upEvent.latlng.lat - startLatLng.lat;
              const deltaLng = upEvent.latlng.lng - startLatLng.lng;
              if (Math.abs(deltaLat) > 0.000001 || Math.abs(deltaLng) > 0.000001) {
                onUpdate({
                  center: {
                    lat: startCenter.lat + deltaLat,
                    lng: startCenter.lng + deltaLng,
                  },
                });
              }
            };

            map.dragging.disable();
            map.on('mousemove', onMouseMove);
            map.on('mouseup', onMouseUp);
          },
        }}
      />

      {/* Center handle - trunk for trees, small circle for others */}
      {/* This is grabbable in ALL modes (select and drawing) */}
      <LeafletCircle
        ref={trunkRef}
        center={[shape.center.lat, shape.center.lng]}
        radius={isTree ? trunkRadiusMeters : Math.max(0.5, canopyRadiusMeters * 0.15)}
        pathOptions={{
          fillColor: isTree ? '#5D4037' : layer.color,
          fillOpacity: 0.9,
          color: isSelected ? '#fbbf24' : (isTree ? '#3E2723' : layer.color),
          weight: isSelected ? 3 : 2,
        }}
        eventHandlers={{
          click: (e) => {
            // Only intercept clicks in select mode — in drawing mode let the map handle it
            if (activeTool === 'select') {
              L.DomEvent.stopPropagation(e);
              onSelect();
            }
          },
          mousedown: (e) => {
            // Allow dragging from center only in select mode when already selected
            if (!isSelected || activeTool !== 'select') return;
            L.DomEvent.stopPropagation(e);

            const startLatLng = e.latlng;
            const startCenter = shape.center!;

            const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
              const deltaLat = moveEvent.latlng.lat - startLatLng.lat;
              const deltaLng = moveEvent.latlng.lng - startLatLng.lng;
              const newCenter = {
                lat: startCenter.lat + deltaLat,
                lng: startCenter.lng + deltaLng,
              };
              if (canopyRef.current) {
                canopyRef.current.setLatLng([newCenter.lat, newCenter.lng]);
              }
              if (trunkRef.current) {
                trunkRef.current.setLatLng([newCenter.lat, newCenter.lng]);
              }
            };

            const onMouseUp = (upEvent: L.LeafletMouseEvent) => {
              map.off('mousemove', onMouseMove);
              map.off('mouseup', onMouseUp);
              map.dragging.enable();

              const deltaLat = upEvent.latlng.lat - startLatLng.lat;
              const deltaLng = upEvent.latlng.lng - startLatLng.lng;
              if (Math.abs(deltaLat) > 0.000001 || Math.abs(deltaLng) > 0.000001) {
                onUpdate({
                  center: {
                    lat: startCenter.lat + deltaLat,
                    lng: startCenter.lng + deltaLng,
                  },
                });
              }
            };

            map.dragging.disable();
            map.on('mousemove', onMouseMove);
            map.on('mouseup', onMouseUp);
          },
        }}
      >
        {shape.plantName && (
          <Tooltip sticky={false} direction="top" offset={[0, -8]} opacity={1}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{shape.plantName}</div>
            {shape.plantScientificName && (
              <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#6b7280' }}>{shape.plantScientificName}</div>
            )}
          </Tooltip>
        )}
      </LeafletCircle>

      {/* Resize handle for selected circles */}
      {isSelected && shape.center && (
        <Marker
          position={[
            shape.center.lat,
            shape.center.lng + (canopyRadiusMeters * 0.000009), // Position at edge
          ]}
          icon={L.divIcon({
            className: 'resize-handle',
            html: '<div style="width:14px;height:14px;background:#fbbf24;border:2px solid white;border-radius:50%;cursor:ew-resize;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          })}
          draggable={true}
          eventHandlers={{
            drag: (e) => {
              const markerLatLng = e.target.getLatLng();
              const center = shape.center!;
              const newRadiusMeters = map.distance([center.lat, center.lng], [markerLatLng.lat, markerLatLng.lng]);
              if (canopyRef.current) {
                canopyRef.current.setRadius(newRadiusMeters);
              }
            },
            dragend: (e) => {
              const markerLatLng = e.target.getLatLng();
              const center = shape.center!;
              const newRadiusMeters = map.distance([center.lat, center.lng], [markerLatLng.lat, markerLatLng.lng]);
              const newRadiusFeet = Math.max(3, newRadiusMeters / 0.3048);
              onUpdate({ canopyRadius: newRadiusFeet });
            },
          }}
        />
      )}
    </>
  );
}

// Interactive polygon component
function EditablePolygon({
  shape,
  layer,
  isSelected,
  isVisible,
  activeTool,
  onSelect,
  onUpdate,
}: {
  shape: Shape;
  layer: typeof FOOD_FOREST_LAYERS[0];
  isSelected: boolean;
  isVisible: boolean;
  activeTool: DrawingTool;
  onSelect: () => void;
  onUpdate: (updates: Partial<Shape>) => void;
}) {
  const polygonRef = useRef<L.Polygon | null>(null);
  const map = useMap();

  if (!shape.points || shape.points.length < 3 || !isVisible) return null;

  const positions = shape.points.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <>
      <LeafletPolygon
        ref={polygonRef}
        positions={positions}
        pathOptions={{
          fillColor: layer.color,
          fillOpacity: isSelected ? 0.45 : 0.3,
          color: isSelected ? '#fbbf24' : layer.color,
          weight: isSelected ? 4 : 2,
        }}
        eventHandlers={{
          click: (e) => {
            if (activeTool === 'select') {
              L.DomEvent.stopPropagation(e);
              onSelect();
            }
          },
          mousedown: (e) => {
            if (!isSelected) return;
            L.DomEvent.stopPropagation(e);

            const startLatLng = e.latlng;
            const startPoints = [...shape.points!];

            const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
              const deltaLat = moveEvent.latlng.lat - startLatLng.lat;
              const deltaLng = moveEvent.latlng.lng - startLatLng.lng;
              const newPoints = startPoints.map(p => ({
                lat: p.lat + deltaLat,
                lng: p.lng + deltaLng,
              }));
              if (polygonRef.current) {
                polygonRef.current.setLatLngs(newPoints.map(p => [p.lat, p.lng]));
              }
            };

            const onMouseUp = (upEvent: L.LeafletMouseEvent) => {
              map.off('mousemove', onMouseMove);
              map.off('mouseup', onMouseUp);
              map.dragging.enable();

              const deltaLat = upEvent.latlng.lat - startLatLng.lat;
              const deltaLng = upEvent.latlng.lng - startLatLng.lng;
              if (Math.abs(deltaLat) > 0.000001 || Math.abs(deltaLng) > 0.000001) {
                onUpdate({
                  points: startPoints.map(p => ({
                    lat: p.lat + deltaLat,
                    lng: p.lng + deltaLng,
                  })),
                });
              }
            };

            map.dragging.disable();
            map.on('mousemove', onMouseMove);
            map.on('mouseup', onMouseUp);
          },
        }}
      />
      {/* Center handle - grabbable in ALL modes */}
      {(() => {
        const centerLat = shape.points!.reduce((sum, p) => sum + p.lat, 0) / shape.points!.length;
        const centerLng = shape.points!.reduce((sum, p) => sum + p.lng, 0) / shape.points!.length;
        return (
          <Marker
            position={[centerLat, centerLng]}
            icon={L.divIcon({
              className: 'center-handle',
              html: `<div style="width:16px;height:16px;background:${layer.color};border:3px solid white;border-radius:50%;cursor:grab;box-shadow:0 2px 6px rgba(0,0,0,0.3);${isSelected ? 'outline:2px solid #fbbf24;' : ''}"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                onSelect();
              },
              mousedown: (e) => {
                if (!isSelected) return;
                L.DomEvent.stopPropagation(e.originalEvent);

                const startLatLng = e.latlng;
                const startPoints = [...shape.points!];

                const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
                  const deltaLat = moveEvent.latlng.lat - startLatLng.lat;
                  const deltaLng = moveEvent.latlng.lng - startLatLng.lng;
                  const newPoints = startPoints.map(p => ({
                    lat: p.lat + deltaLat,
                    lng: p.lng + deltaLng,
                  }));
                  if (polygonRef.current) {
                    polygonRef.current.setLatLngs(newPoints.map(p => [p.lat, p.lng]));
                  }
                };

                const onMouseUp = (upEvent: L.LeafletMouseEvent) => {
                  map.off('mousemove', onMouseMove);
                  map.off('mouseup', onMouseUp);
                  map.dragging.enable();

                  const deltaLat = upEvent.latlng.lat - startLatLng.lat;
                  const deltaLng = upEvent.latlng.lng - startLatLng.lng;
                  if (Math.abs(deltaLat) > 0.000001 || Math.abs(deltaLng) > 0.000001) {
                    onUpdate({
                      points: startPoints.map(p => ({
                        lat: p.lat + deltaLat,
                        lng: p.lng + deltaLng,
                      })),
                    });
                  }
                };

                map.dragging.disable();
                map.on('mousemove', onMouseMove);
                map.on('mouseup', onMouseUp);
              },
            }}
          >
            {shape.plantName && (
              <Tooltip sticky={false} direction="top" offset={[0, -12]} opacity={1}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{shape.plantName}</div>
                {shape.plantScientificName && (
                  <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#6b7280' }}>{shape.plantScientificName}</div>
                )}
              </Tooltip>
            )}
          </Marker>
        );
      })()}

      {/* Vertex handles for selected polygons */}
      {isSelected && shape.points.map((point, index) => (
        <Marker
          key={`vertex-${index}`}
          position={[point.lat, point.lng]}
          icon={L.divIcon({
            className: 'vertex-handle',
            html: '<div style="width:10px;height:10px;background:#fbbf24;border:2px solid white;border-radius:50%;cursor:move;"></div>',
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const newLatLng = e.target.getLatLng();
              const newPoints = [...shape.points!];
              newPoints[index] = { lat: newLatLng.lat, lng: newLatLng.lng };
              onUpdate({ points: newPoints });
            },
          }}
        />
      ))}
    </>
  );
}

// Interactive polyline component
function EditablePolyline({
  shape,
  layer,
  isSelected,
  isVisible,
  activeTool,
  onSelect,
  onUpdate,
}: {
  shape: Shape;
  layer: typeof FOOD_FOREST_LAYERS[0];
  isSelected: boolean;
  isVisible: boolean;
  activeTool: DrawingTool;
  onSelect: () => void;
  onUpdate: (updates: Partial<Shape>) => void;
}) {
  const polylineRef = useRef<L.Polyline | null>(null);
  const map = useMap();

  if (!shape.points || shape.points.length < 2 || !isVisible) return null;

  const positions = shape.points.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <>
      <LeafletPolyline
        ref={polylineRef}
        positions={positions}
        pathOptions={{
          color: isSelected ? '#fbbf24' : layer.color,
          weight: isSelected ? 4 : 3,
        }}
        eventHandlers={{
          click: (e) => {
            if (activeTool === 'select') {
              L.DomEvent.stopPropagation(e);
              onSelect();
            }
          },
          mousedown: (e) => {
            if (!isSelected) return;
            L.DomEvent.stopPropagation(e);

            const startLatLng = e.latlng;
            const startPoints = [...shape.points!];

            const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
              const deltaLat = moveEvent.latlng.lat - startLatLng.lat;
              const deltaLng = moveEvent.latlng.lng - startLatLng.lng;
              const newPoints = startPoints.map(p => ({
                lat: p.lat + deltaLat,
                lng: p.lng + deltaLng,
              }));
              if (polylineRef.current) {
                polylineRef.current.setLatLngs(newPoints.map(p => [p.lat, p.lng]));
              }
            };

            const onMouseUp = (upEvent: L.LeafletMouseEvent) => {
              map.off('mousemove', onMouseMove);
              map.off('mouseup', onMouseUp);
              map.dragging.enable();

              const deltaLat = upEvent.latlng.lat - startLatLng.lat;
              const deltaLng = upEvent.latlng.lng - startLatLng.lng;
              if (Math.abs(deltaLat) > 0.000001 || Math.abs(deltaLng) > 0.000001) {
                onUpdate({
                  points: startPoints.map(p => ({
                    lat: p.lat + deltaLat,
                    lng: p.lng + deltaLng,
                  })),
                });
              }
            };

            map.dragging.disable();
            map.on('mousemove', onMouseMove);
            map.on('mouseup', onMouseUp);
          },
        }}
      />
      {/* Center handle at midpoint - grabbable in ALL modes */}
      {(() => {
        const midLat = (shape.points![0].lat + shape.points![1].lat) / 2;
        const midLng = (shape.points![0].lng + shape.points![1].lng) / 2;
        return (
          <Marker
            position={[midLat, midLng]}
            icon={L.divIcon({
              className: 'center-handle',
              html: `<div style="width:16px;height:16px;background:${layer.color};border:3px solid white;border-radius:50%;cursor:grab;box-shadow:0 2px 6px rgba(0,0,0,0.3);${isSelected ? 'outline:2px solid #fbbf24;' : ''}"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e.originalEvent);
                onSelect();
              },
              mousedown: (e) => {
                if (!isSelected) return;
                L.DomEvent.stopPropagation(e.originalEvent);

                const startLatLng = e.latlng;
                const startPoints = [...shape.points!];

                const onMouseMove = (moveEvent: L.LeafletMouseEvent) => {
                  const deltaLat = moveEvent.latlng.lat - startLatLng.lat;
                  const deltaLng = moveEvent.latlng.lng - startLatLng.lng;
                  const newPoints = startPoints.map(p => ({
                    lat: p.lat + deltaLat,
                    lng: p.lng + deltaLng,
                  }));
                  if (polylineRef.current) {
                    polylineRef.current.setLatLngs(newPoints.map(p => [p.lat, p.lng]));
                  }
                };

                const onMouseUp = (upEvent: L.LeafletMouseEvent) => {
                  map.off('mousemove', onMouseMove);
                  map.off('mouseup', onMouseUp);
                  map.dragging.enable();

                  const deltaLat = upEvent.latlng.lat - startLatLng.lat;
                  const deltaLng = upEvent.latlng.lng - startLatLng.lng;
                  if (Math.abs(deltaLat) > 0.000001 || Math.abs(deltaLng) > 0.000001) {
                    onUpdate({
                      points: startPoints.map(p => ({
                        lat: p.lat + deltaLat,
                        lng: p.lng + deltaLng,
                      })),
                    });
                  }
                };

                map.dragging.disable();
                map.on('mousemove', onMouseMove);
                map.on('mouseup', onMouseUp);
              },
            }}
          >
            {shape.plantName && (
              <Tooltip sticky={false} direction="top" offset={[0, -12]} opacity={1}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{shape.plantName}</div>
                {shape.plantScientificName && (
                  <div style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#6b7280' }}>{shape.plantScientificName}</div>
                )}
              </Tooltip>
            )}
          </Marker>
        );
      })()}

      {/* Vertex handles for selected polylines */}
      {isSelected && shape.points.map((point, index) => (
        <Marker
          key={`vertex-${index}`}
          position={[point.lat, point.lng]}
          icon={L.divIcon({
            className: 'vertex-handle',
            html: '<div style="width:10px;height:10px;background:#fbbf24;border:2px solid white;border-radius:50%;cursor:move;"></div>',
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const newLatLng = e.target.getLatLng();
              const newPoints = [...shape.points!];
              newPoints[index] = { lat: newLatLng.lat, lng: newLatLng.lng };
              onUpdate({ points: newPoints });
            },
          }}
        />
      ))}
    </>
  );
}

// Drawing preview component for polygon/line in progress
function DrawingPreview({
  points,
  activeTool,
  layerColor,
  onClosePolygon,
}: {
  points: Point[];
  activeTool: DrawingTool;
  layerColor: string;
  onClosePolygon?: () => void;
}) {
  if (points.length === 0) return null;

  const positions = points.map(p => [p.lat, p.lng] as [number, number]);

  if (activeTool === 'polygon' && positions.length >= 2) {
    const canClose = positions.length >= 3;
    return (
      <>
        <LeafletPolyline
          positions={positions}
          pathOptions={{
            color: layerColor,
            weight: 2,
            dashArray: '5, 5',
          }}
        />
        {positions.map((pos, index) => (
          <Marker
            key={`draw-point-${index}`}
            position={pos}
            icon={L.divIcon({
              className: 'draw-point',
              html: `<div style="width:${index === 0 && canClose ? 20 : (index === 0 ? 12 : 8)}px;height:${index === 0 && canClose ? 20 : (index === 0 ? 12 : 8)}px;background:${index === 0 ? '#fbbf24' : layerColor};border:${index === 0 && canClose ? '3px' : '2px'} solid white;border-radius:50%;cursor:${index === 0 && canClose ? 'pointer' : 'default'};${index === 0 && canClose ? 'box-shadow:0 0 0 4px rgba(251,191,36,0.4);' : ''}"></div>`,
              iconSize: [index === 0 && canClose ? 20 : (index === 0 ? 12 : 8), index === 0 && canClose ? 20 : (index === 0 ? 12 : 8)],
              iconAnchor: [index === 0 && canClose ? 10 : (index === 0 ? 6 : 4), index === 0 && canClose ? 10 : (index === 0 ? 6 : 4)],
            })}
            eventHandlers={index === 0 && canClose ? {
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onClosePolygon?.();
              },
            } : undefined}
          />
        ))}
        {canClose && (
          <Marker
            position={positions[0]}
            icon={L.divIcon({
              className: 'close-indicator',
              html: '<div style="padding:2px 6px;background:#fbbf24;color:white;font-size:11px;font-weight:bold;border-radius:4px;white-space:nowrap;pointer-events:none;">Click to close</div>',
              iconSize: [80, 20],
              iconAnchor: [40, -15],
            })}
          />
        )}
      </>
    );
  }

  if (activeTool === 'line' && positions.length === 1) {
    return (
      <Marker
        position={positions[0]}
        icon={L.divIcon({
          className: 'draw-point',
          html: `<div style="width:10px;height:10px;background:${layerColor};border:2px solid white;border-radius:50%;"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        })}
      />
    );
  }

  return null;
}

// Convert a PlacementSuggestion into lat/lng by offsetting from a reference shape.
// Uses approximate degree conversions for Texas (lat ~30°).
function computePlacementPosition(
  suggestion: PlacementSuggestion,
  shapes: Shape[],
): { lat: number; lng: number } | null {
  // Find the reference plant shape by name (case-insensitive partial match)
  const ref = shapes.find(
    s => s.plantName && s.plantName.toLowerCase().includes(suggestion.nearPlantName.toLowerCase())
  );
  const origin = ref?.center ?? (ref?.points?.[0] ?? null);
  if (!origin) return null;

  const ft = suggestion.distanceFt;
  // 1 foot ≈ 0.00000275° lat, ≈ 0.00000317° lng at lat 30°
  const dLat = ft * 0.00000275;
  const dLng = ft * 0.00000317;

  const offsets: Record<string, { lat: number; lng: number }> = {
    north:     { lat:  dLat, lng:  0 },
    south:     { lat: -dLat, lng:  0 },
    east:      { lat:  0,    lng:  dLng },
    west:      { lat:  0,    lng: -dLng },
    northeast: { lat:  dLat * 0.707, lng:  dLng * 0.707 },
    northwest: { lat:  dLat * 0.707, lng: -dLng * 0.707 },
    southeast: { lat: -dLat * 0.707, lng:  dLng * 0.707 },
    southwest: { lat: -dLat * 0.707, lng: -dLng * 0.707 },
  };

  const off = offsets[suggestion.direction] ?? { lat: 0, lng: 0 };
  return { lat: origin.lat + off.lat, lng: origin.lng + off.lng };
}

export function LayersScreen({
  projectId,
  mapCenter,
  boundaryPoints,
  shapes,
  onShapesChange,
  groundcoverSpecies,
  onGroundcoverSpeciesChange,
  waterFeatures,
  onWaterFeaturesChange,
  onBackToDashboard,
  onOpenConsultation,
  pendingRecommendations,
  onClearRecommendations,
  placementSuggestion,
  onClearPlacement,
  onOpenPlanning,
  onShapePlanted,
  consultationHistory,
  onSaveConsultationHistory,
  rejectedPlants,
  onSaveRejectedPlants,
}: LayersScreenProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string>('canopy');
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({});
  const [sidebarMode, setSidebarMode] = useState<'layers' | 'water'>('layers');
  const [activeWaterTool, setActiveWaterTool] = useState<WaterFeatureType | null>(null);
  const [selectedWaterFeature, setSelectedWaterFeature] = useState<WaterFeature | null>(null);
  const [waterSelectMode, setWaterSelectMode] = useState(false);
  const [showWizard, setShowWizard] = useState(true);
  const [wizardLayerIndex, setWizardLayerIndex] = useState(-1);
  const [localMap, setLocalMap] = useState<L.Map | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Leaflet renders gray after its container resizes unless told to recompute.
  // Fire invalidateSize across a few frames so one definitely lands after the
  // layout has settled (no CSS animation to fight with).
  function toggleSidebar() {
    setSidebarCollapsed(c => !c);
    const refresh = () => localMap?.invalidateSize();
    requestAnimationFrame(refresh);
    setTimeout(refresh, 60);
    setTimeout(refresh, 180);
    setTimeout(refresh, 360);
  }
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [activePlant, setActivePlant] = useState<Plant | null>(null);
  const [drawingState, setDrawingState] = useState<{ isDrawing: boolean; points: Point[] }>({ isDrawing: false, points: [] });
  const [mapType, setMapType] = useState<'light' | 'dark' | 'satellite' | 'street'>('light');
  const [zoomLevel, setZoomLevel] = useState(20);
  const [showSnapshotGallery, setShowSnapshotGallery] = useState(false);
  const [activePlacementAdvice, setActivePlacementAdvice] = useState<string | null>(null);
  const [pendingRec, setPendingRec] = useState<PlantRecommendation | null>(null);
  const [placementMode, setPlacementMode] = useState<'suggest' | 'tweak' | 'placed'>('suggest');
  const [tweakPos, setTweakPos] = useState<{ lat: number; lng: number } | null>(null);
  const [confettiPos, setConfettiPos] = useState<{ x: number; y: number } | null>(null);
  const [confettiColor, setConfettiColor] = useState('#059669');
  const layersMapRef = useRef<HTMLDivElement>(null);

  // All plants — used to resolve recommendation chips to Plant objects
  const { plants: allPlants } = usePlants();

  // Reset placement mode whenever a new suggestion arrives or is cleared
  useEffect(() => {
    setPlacementMode('suggest');
    setTweakPos(null);
    setConfettiPos(null);
  }, [placementSuggestion]);

  // Resolve pending recommendation once allPlants loads
  useEffect(() => {
    if (!pendingRec || allPlants.length === 0) return;
    const found = allPlants.find(p =>
      p.commonName.toLowerCase() === pendingRec.commonName.toLowerCase() ||
      p.scientificName.toLowerCase() === pendingRec.scientificName.toLowerCase()
    );
    if (found) {
      setActivePlant(found);
      setPendingRec(null);
    }
  }, [allPlants, pendingRec]);

  // Initialize all layers as visible
  useEffect(() => {
    const initialVisibility: LayerVisibility = {};
    FOOD_FOREST_LAYERS.forEach(layer => {
      initialVisibility[layer.id] = true;
    });
    setLayerVisibility(initialVisibility);
  }, []);

  // Skip wizard if project already has shapes
  useEffect(() => {
    if (shapes.length > 0) {
      setShowWizard(false);
      setWizardLayerIndex(-1);
    }
  }, [shapes.length]);

  // Helper to select a layer from sidebar (changes to default tool)
  function selectLayerFromSidebar(layerId: string) {
    setSelectedLayerId(layerId);
    const layer = FOOD_FOREST_LAYERS.find(l => l.id === layerId);
    if (layer) {
      setActiveTool(layer.defaultTool);
    }
  }

  // Helper to switch layer when clicking a shape (keeps current tool)
  function switchToLayerFromShape(layerId: string) {
    setSelectedLayerId(layerId);
    // Don't change tool - keep current select/drawing mode
  }

  // Reset drawing state when tool changes
  useEffect(() => {
    setDrawingState({ isDrawing: false, points: [] });
  }, [activeTool, selectedLayerId]);

  function handleWizardNext() {
    const nextIndex = wizardLayerIndex + 1;
    if (nextIndex >= FOOD_FOREST_LAYERS.length) {
      setShowWizard(false);
      setWizardLayerIndex(-1);
    } else {
      setWizardLayerIndex(nextIndex);
      if (nextIndex >= 0) {
        const layer = FOOD_FOREST_LAYERS[nextIndex];
        setSelectedLayerId(layer.id);
        setActiveTool(layer.defaultTool);
      }
    }
  }

  function toggleLayerVisibility(layerId: string) {
    setLayerVisibility(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  }

  function showAllLayers() {
    const allVisible: LayerVisibility = {};
    FOOD_FOREST_LAYERS.forEach(layer => {
      allVisible[layer.id] = true;
    });
    setLayerVisibility(allVisible);
  }

  function hideAllLayers() {
    const allHidden: LayerVisibility = {};
    FOOD_FOREST_LAYERS.forEach(layer => {
      allHidden[layer.id] = false;
    });
    setLayerVisibility(allHidden);
  }

  function clearLayer(layerId: string) {
    if (confirm(`Delete all plants in ${FOOD_FOREST_LAYERS.find(l => l.id === layerId)?.name} layer?`)) {
      onShapesChange(shapes.filter(s => s.layerId !== layerId));
    }
  }

  function handlePlantAssign(plant: Plant, switchToLayer?: string) {
    if (switchToLayer) {
      selectLayerFromSidebar(switchToLayer);
    }

    if (selectedShape) {
      const updatedShapes = shapes.map(s =>
        s.id === selectedShape.id
          ? { ...s, plantId: plant.id, plantName: plant.commonName, plantScientificName: plant.scientificName }
          : s
      );
      onShapesChange(updatedShapes);
      setSelectedShape({ ...selectedShape, plantId: plant.id, plantName: plant.commonName, plantScientificName: plant.scientificName });
    }

    setActivePlant(plant);
    // Clear AI placement advice when user manually picks a plant
    setActivePlacementAdvice(null);
  }

  function handleClearActivePlant() {
    setActivePlant(null);
  }

  function handlePlantRemove() {
    if (!selectedShape) return;

    const updatedShapes = shapes.map(s =>
      s.id === selectedShape.id
        ? { ...s, plantId: undefined, plantName: undefined, plantScientificName: undefined }
        : s
    );
    onShapesChange(updatedShapes);
    setSelectedShape({ ...selectedShape, plantId: undefined, plantName: undefined, plantScientificName: undefined });
  }

  const DEFAULT_SIZES: Record<string, { trunk: number; canopy: number }> = {
    canopy: { trunk: 2, canopy: 25 },
    understory: { trunk: 1.5, canopy: 15 },
    shrub: { trunk: 0, canopy: 6 },
    herbaceous: { trunk: 0, canopy: 3 },
    groundcover: { trunk: 0, canopy: 5 },
    rhizosphere: { trunk: 0, canopy: 4 },
    vine: { trunk: 0, canopy: 2 },
    infrastructure: { trunk: 0, canopy: 3 },
  };

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    // Water tool mode
    if (activeWaterTool) {
      const newFeature: WaterFeature = {
        id: `water_${Date.now()}_${Math.random()}`,
        type: activeWaterTool,
        position: { lat: latlng.lat, lng: latlng.lng },
      };
      onWaterFeaturesChange([...waterFeatures, newFeature]);
      return;
    }

    // Photo anchors tool
    if (activeTool === 'photoAnchors' && sidebarMode === 'layers') {
      if (e.originalEvent.shiftKey) {
        // Shift+click: set target for the last anchor point
        const anchorPoints = shapes.filter(s => s.photoAnchor);
        if (anchorPoints.length === 0) {
          alert('Create an anchor point first');
          return;
        }
        const lastAnchor = anchorPoints[anchorPoints.length - 1];
        onShapesChange(shapes.map(s =>
          s.id === lastAnchor.id
            ? { ...s, targetPoint: { lat: latlng.lat, lng: latlng.lng } }
            : s
        ));
      } else {
        // Normal click: create new anchor point
        const newAnchor: Shape = {
          id: `anchor_${Date.now()}_${Math.random()}`,
          layerId: 'infrastructure',
          type: 'circle',
          center: { lat: latlng.lat, lng: latlng.lng },
          radius: 0,
          canopyRadius: 15,
          photoAnchor: true,
        };
        onShapesChange([...shapes, newAnchor]);
        setSelectedShape(newAnchor);
      }
      return;
    }

    // Circle tool
    if (activeTool === 'circle' && selectedLayerId && sidebarMode === 'layers') {
      const defaults = DEFAULT_SIZES[selectedLayerId] || { trunk: 0, canopy: 5 };
      const isTree = selectedLayerId === 'canopy' || selectedLayerId === 'understory';

      const newShape: Shape = {
        id: `shape_${Date.now()}_${Math.random()}`,
        layerId: selectedLayerId,
        type: 'circle',
        center: { lat: latlng.lat, lng: latlng.lng },
        radius: isTree ? defaults.trunk : 0,
        canopyRadius: defaults.canopy,
        ...(activePlant && {
          plantId: activePlant.id,
          plantName: activePlant.commonName,
          plantScientificName: activePlant.scientificName,
        }),
      };

      onShapesChange([...shapes, newShape]);
      setSelectedShape(newShape);
      if (activePlant) onShapePlanted(newShape);
    }
  }, [activeWaterTool, activeTool, selectedLayerId, sidebarMode, activePlant, shapes, onShapesChange, onShapePlanted, waterFeatures, onWaterFeaturesChange]);

  function handleShapeCreated(newShape: Shape) {
    onShapesChange([...shapes, newShape]);
    setSelectedShape(newShape);
  }

  function handleShapeUpdate(shapeId: string, updates: Partial<Shape>) {
    const updatedShapes = shapes.map(s =>
      s.id === shapeId ? { ...s, ...updates } : s
    );
    onShapesChange(updatedShapes);
    if (selectedShape?.id === shapeId) {
      setSelectedShape({ ...selectedShape, ...updates });
    }
  }

  // Keyboard delete
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShape) {
        e.preventDefault();
        onShapesChange(shapes.filter(s => s.id !== selectedShape.id));
        setSelectedShape(null);
      }
      // Delete water feature
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWaterFeature) {
        e.preventDefault();
        onWaterFeaturesChange(waterFeatures.filter(f => f.id !== selectedWaterFeature.id));
        setSelectedWaterFeature(null);
      }
      if (e.key === 'Escape') {
        if (drawingState.isDrawing) {
          setDrawingState({ isDrawing: false, points: [] });
        } else {
          setSelectedShape(null);
          setSelectedWaterFeature(null);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape, shapes, onShapesChange, drawingState.isDrawing, selectedWaterFeature, waterFeatures, onWaterFeaturesChange]);

  function handlePlaceHere() {
    if (!placementSuggestion) return;
    const pos = tweakPos ?? computePlacementPosition(placementSuggestion, shapes);
    if (!pos) return;

    const layerObj = FOOD_FOREST_LAYERS.find(l => l.id === placementSuggestion.layer);
    if (!layerObj) return;

    const defaults = DEFAULT_SIZES[placementSuggestion.layer] || { trunk: 0, canopy: 5 };
    const isTree = placementSuggestion.layer === 'canopy' || placementSuggestion.layer === 'understory';

    const newShape: Shape = {
      id: `shape_${Date.now()}_${Math.random()}`,
      layerId: placementSuggestion.layer,
      type: 'circle',
      center: pos,
      radius: isTree ? defaults.trunk : 0,
      canopyRadius: defaults.canopy,
      plantName: placementSuggestion.plantName,
      status: 'planned',
    };

    onShapesChange([...shapes, newShape]);
    setSelectedShape(newShape);
    onShapePlanted(newShape);
    setSelectedLayerId(layerObj.id);
    setActiveTool('select');
    setPlacementMode('placed');
    setConfettiColor(layerObj.color);

    // Position confetti at the marker's pixel coordinates on screen
    if (localMap && layersMapRef.current) {
      const containerPoint = localMap.latLngToContainerPoint(L.latLng(pos.lat, pos.lng));
      const mapRect = localMap.getContainer().getBoundingClientRect();
      const layersRect = layersMapRef.current.getBoundingClientRect();
      setConfettiPos({
        x: containerPoint.x + (mapRect.left - layersRect.left),
        y: containerPoint.y + (mapRect.top - layersRect.top),
      });
      setTimeout(() => setConfettiPos(null), 1400);
    }
  }

  function handleZoom(direction: 'in' | 'out' | 'fit') {
    if (!localMap) return;

    if (direction === 'fit' && boundaryPoints.length > 0) {
      const bounds = L.latLngBounds(boundaryPoints.map(p => [p.lat, p.lng] as [number, number]));
      localMap.fitBounds(bounds);
    } else {
      const currentZoom = localMap.getZoom();
      localMap.setZoom(direction === 'in' ? currentZoom + 1 : currentZoom - 1);
    }
  }

  const layerShapeCounts = FOOD_FOREST_LAYERS.map(layer => ({
    ...layer,
    count: layer.id === 'groundcover'
      ? groundcoverSpecies.length
      : shapes.filter(s => s.layerId === layer.id).length
  }));

  const currentLayer = FOOD_FOREST_LAYERS.find(l => l.id === selectedLayerId);

  return (
    <div className="layers-screen">
      {/* Header */}
      <div className="layers-header">
        <button onClick={onBackToDashboard} className="header-btn">
          <ArrowLeft size={18} />
          Dashboard
        </button>
        <h1>Design Your Food Forest</h1>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
          <button onClick={() => onOpenConsultation()} className="header-btn-primary">
            <Sparkles size={18} />
            AI Advisor
          </button>
          <button onClick={onOpenPlanning} className="header-btn-primary">
            🌱 Grow Your Forest
          </button>
          <button onClick={() => setShowSnapshotGallery(true)} className="header-btn-primary">
            <Camera size={18} />
            Snapshots
          </button>
        </div>
      </div>

      {/* AI Recommendations Banner */}
      {pendingRecommendations.length > 0 && (
        <div className="recommendations-banner">
          <div className="recommendations-banner-header">
            <Sparkles size={16} />
            <span>AI Plant Plan — {pendingRecommendations.length} plants recommended. Click a plant to select it, then draw it on the map.</span>
            <button className="recommendations-dismiss" onClick={onClearRecommendations}>
              <X size={16} />
            </button>
          </div>
          <div className="recommendations-list">
            {pendingRecommendations.map((rec, i) => {
              const layer = FOOD_FOREST_LAYERS.find(l => l.id === rec.layer);
              return (
                <button
                  key={i}
                  className={`recommendation-chip ${activePlant?.commonName === rec.commonName ? 'active' : ''}`}
                  style={{ borderColor: layer?.color || '#059669', color: layer?.color || '#059669' }}
                  onClick={() => {
                    selectLayerFromSidebar(rec.layer);
                    const found = allPlants.find(p =>
                      p.commonName.toLowerCase() === rec.commonName.toLowerCase() ||
                      p.scientificName.toLowerCase() === rec.scientificName.toLowerCase()
                    );
                    if (found) {
                      setActivePlant(found);
                      setPendingRec(null);
                    } else {
                      // Plants still loading — resolve once allPlants arrives
                      setPendingRec(rec);
                    }
                    setActivePlacementAdvice(rec.reason);
                  }}
                >
                  <span className="recommendation-chip-layer" style={{ background: layer?.color || '#059669' }} />
                  {rec.commonName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className="layers-content"
        style={{
          position: 'relative',
          gridTemplateColumns: sidebarCollapsed ? '0px 1fr' : '350px 1fr',
          gridTemplateRows: 'minmax(0, 1fr)', // fill height even when the sidebar is hidden
        }}
      >
        {/* Collapse / expand the left controls sidebar */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Show controls' : 'Hide controls'}
          style={{
            position: 'absolute', top: 10, left: sidebarCollapsed ? 8 : 358, zIndex: 1100,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)', padding: '8px 5px', cursor: 'pointer', color: '#064e3b',
          }}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {/* Sidebar */}
        <div className="layers-sidebar" style={{ gridColumn: 1, display: sidebarCollapsed ? 'none' : undefined }}>
          {showWizard && wizardLayerIndex >= 0 && (
            <LayerWizard
              currentLayerIndex={wizardLayerIndex}
              onComplete={() => setShowWizard(false)}
              onNext={handleWizardNext}
            />
          )}

          {(!showWizard || wizardLayerIndex < 0) && (
            <>
              {/* Sidebar Mode Tabs */}
              <div className="sidebar-tabs">
                <button
                  className={`sidebar-tab ${sidebarMode === 'layers' ? 'active' : ''}`}
                  onClick={() => {
                    setSidebarMode('layers');
                    setActiveWaterTool(null);
                    setWaterSelectMode(false);
                    setSelectedWaterFeature(null);
                  }}
                >
                  <Layers size={16} />
                  Plant Layers
                </button>
                <button
                  className={`sidebar-tab ${sidebarMode === 'water' ? 'active' : ''}`}
                  onClick={() => {
                    setSidebarMode('water');
                    setActiveTool('select');
                    setWaterSelectMode(true); // Default to select mode in water tab
                  }}
                >
                  <Droplets size={16} />
                  Water & Topo
                </button>
              </div>

              {/* Layer Description */}
              {sidebarMode === 'layers' && currentLayer && (() => {
                const Icon = currentLayer.icon;
                return (
                  <div className="sidebar-section layer-description-section">
                    <div className="layer-description-header">
                      <Icon size={24} color={currentLayer.color} />
                      <h3 style={{ color: currentLayer.color }}>{currentLayer.name}</h3>
                    </div>
                    <p className="layer-description-text">{currentLayer.description}</p>
                  </div>
                );
              })()}

              {/* Layers Mode Content */}
              {sidebarMode === 'layers' && (
                <>
                  {/* Layer Selector with Visibility */}
                  <div className="sidebar-section">
                    <div className="layers-header-row">
                      <h3>Layers</h3>
                      <div className="visibility-controls">
                        <button onClick={showAllLayers} className="btn-small">Show All</button>
                        <button onClick={hideAllLayers} className="btn-small">Hide All</button>
                      </div>
                    </div>
                    <div className="layer-list">
                      {layerShapeCounts.filter(l => l.id !== 'infrastructure').map(layer => {
                        const Icon = layer.icon;
                        const isActive = layer.id === selectedLayerId;
                        const isVisible = layerVisibility[layer.id] !== false;

                        return (
                          <div
                            key={layer.id}
                            className={`layer-item ${isActive ? 'active' : ''} ${!isVisible ? 'hidden-layer' : ''}`}
                            onClick={() => selectLayerFromSidebar(layer.id)}
                            role="button"
                            tabIndex={0}
                          >
                            <div
                              className="layer-color-dot"
                              style={{ backgroundColor: layer.color }}
                            />
                            <div className="layer-icon-wrapper">
                              <Icon size={16} color={layer.color} />
                            </div>
                            <div className="layer-info">
                              <span className="layer-name">{layer.name}</span>
                              {layer.count > 0 && <span className="layer-count">({layer.count})</span>}
                            </div>
                            <button
                              className="layer-visibility-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLayerVisibility(layer.id);
                              }}
                              title={isVisible ? 'Hide layer' : 'Show layer'}
                            >
                              {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Plant Brush Indicator */}
                  {activePlant && (
                    <div className="active-plant-brush">
                      <div className="brush-header">
                        <Leaf size={14} />
                        <span>Drawing:</span>
                        <strong>{activePlant.commonName}</strong>
                        <button className="clear-brush-btn" onClick={() => { handleClearActivePlant(); setActivePlacementAdvice(null); }}>
                          <X size={14} />
                        </button>
                      </div>
                      {activePlacementAdvice && (
                        <p className="placement-advice">{activePlacementAdvice}</p>
                      )}
                    </div>
                  )}

                  {/* Selected Shape Info */}
                  {selectedShape && (
                    <div className="sidebar-section selected-shape-section">
                      <div className="selected-shape-header">
                        <h3>{selectedShape.plantName || 'Unassigned'}</h3>
                        <button className="btn-icon" onClick={() => setSelectedShape(null)}>
                          <X size={16} />
                        </button>
                      </div>
                      {selectedShape.plantName && (
                        <p className="scientific">{selectedShape.plantScientificName}</p>
                      )}
                      {/* Status toggle */}
                      <div className="status-toggle">
                        {(['planned', 'establishing', 'established'] as PlantStatus[]).map(s => (
                          <button
                            key={s}
                            className={`status-btn status-btn--${s} ${(selectedShape.status || 'planned') === s ? 'active' : ''}`}
                            onClick={() => handleShapeUpdate(selectedShape.id, { status: s })}
                          >
                            {s === 'planned' ? '📋 Planned' : s === 'establishing' ? '🌱 Establishing' : '🌳 Established'}
                          </button>
                        ))}
                      </div>
                      <div className="plant-actions">
                        {selectedShape.plantName && (
                          <button className="btn-remove" onClick={handlePlantRemove}>
                            Remove plant
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Guild Analysis - show for selected trees */}
                  {selectedShape && selectedShape.plantId && (selectedShape.layerId === 'canopy' || selectedShape.layerId === 'understory') && (
                    <div className="sidebar-section guild-analysis-section">
                      <GuildAnalysis
                        anchorShape={selectedShape}
                        allShapes={shapes}
                        onSelectPlant={(plant) => {
                          setActivePlant(plant);
                          // Switch to appropriate layer for the suggested plant
                          if (plant.layerTypes.length > 0) {
                            selectLayerFromSidebar(plant.layerTypes[0]);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Plant Search */}
                  {(
                    <div className="plant-search-section">
                      <PlantSearch
                        layerId={selectedLayerId}
                        onSelectPlant={handlePlantAssign}
                        onClose={() => {}}
                        selectedPlantId={activePlant?.id}
                        currentLayerId={selectedLayerId}
                        onLayerSwitch={(layerId) => selectLayerFromSidebar(layerId)}
                      />
                    </div>
                  )}

                  {/* Groundcover Selector */}
                  {selectedLayerId === 'groundcover' && (
                    <div className="sidebar-section">
                      <h3>Groundcover Species</h3>
                      <GroundcoverSelector
                        selectedSpecies={groundcoverSpecies}
                        onSpeciesChange={onGroundcoverSpeciesChange}
                      />
                    </div>
                  )}

                  <div className="sidebar-actions">
                    {shapes.filter(s => s.layerId === selectedLayerId).length > 0 && (
                      <button
                        className="btn-danger"
                        onClick={() => clearLayer(selectedLayerId)}
                      >
                        <Trash2 size={16} />
                        Clear Layer
                      </button>
                    )}
                    {selectedLayerId === 'groundcover' && groundcoverSpecies.length > 0 && (
                      <button
                        className="btn-danger"
                        onClick={() => onGroundcoverSpeciesChange([])}
                      >
                        <Trash2 size={16} />
                        Clear Selection
                      </button>
                    )}
                    <button onClick={onBackToDashboard} className="btn-primary">
                      <Home size={16} />
                      Save & Exit
                    </button>
                  </div>
                </>
              )}

              {/* Water & Topography Mode Content */}
              {sidebarMode === 'water' && (
                <>
                  {/* Selected Water Feature Info */}
                  {selectedWaterFeature && (() => {
                    const typeInfo = WATER_FEATURE_TYPES.find(t => t.id === selectedWaterFeature.type);
                    return (
                      <div className="sidebar-section selected-shape-section">
                        <div className="selected-shape-header">
                          <h3>
                            <span style={{ marginRight: '0.5rem' }}>{typeInfo?.icon}</span>
                            {typeInfo?.name}
                          </h3>
                          <button className="btn-icon" onClick={() => setSelectedWaterFeature(null)}>
                            <X size={16} />
                          </button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0' }}>
                          {typeInfo?.description}
                        </p>
                        <div className="plant-actions">
                          <button
                            className="btn-remove"
                            onClick={() => {
                              onWaterFeaturesChange(waterFeatures.filter(f => f.id !== selectedWaterFeature.id));
                              setSelectedWaterFeature(null);
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="sidebar-section">
                    <h3>Water & Topography</h3>
                    <WaterTopography
                      waterFeatures={waterFeatures}
                      onWaterFeaturesChange={onWaterFeaturesChange}
                      activeWaterTool={activeWaterTool}
                      onActiveWaterToolChange={(tool) => {
                        setActiveWaterTool(tool);
                        if (tool) {
                          setWaterSelectMode(false);
                          setSelectedWaterFeature(null);
                        }
                      }}
                    />
                  </div>

                  <div className="sidebar-actions">
                    <button onClick={onBackToDashboard} className="btn-primary">
                      <Home size={16} />
                      Save & Exit
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Map */}
        <div ref={layersMapRef} className={`layers-map${sidebarMode === 'layers' ? ' layers-mode' : ''}`} style={{ gridColumn: 2 }}>
          {/* Water Mode Toolbar */}
          {sidebarMode === 'water' && (
            <div className="drawing-toolbar water-toolbar">
              <div className="toolbar-group">
                <button
                  className={`toolbar-btn ${waterSelectMode ? 'active' : ''}`}
                  onClick={() => {
                    setWaterSelectMode(true);
                    setActiveWaterTool(null);
                  }}
                  title="Select & Move"
                >
                  <MousePointer2 size={18} />
                  <span>Select</span>
                </button>
                <div className="toolbar-divider" />
                <Droplets size={18} color="#3b82f6" />
                <span style={{ fontWeight: 500, color: '#1e40af' }}>Water & Topography</span>
              </div>
              <div className="toolbar-tips">
                {waterSelectMode ? (
                  <span>Click a marker to select • Drag to move • Delete key removes</span>
                ) : activeWaterTool ? (
                  <span style={{ color: '#059669' }}>
                    Click on the map to place a {WATER_FEATURE_TYPES.find(t => t.id === activeWaterTool)?.name.toLowerCase()} marker
                  </span>
                ) : (
                  <span>Select a marker type from the sidebar to begin</span>
                )}
              </div>
            </div>
          )}

          {/* Drawing Toolbar */}
          {sidebarMode === 'layers' && (
            <div className="drawing-toolbar">
              <div className="toolbar-group">
                <button
                  className={`toolbar-btn ${activeTool === 'select' ? 'active' : ''}`}
                  onClick={() => setActiveTool('select')}
                  title="Select & Move (V)"
                >
                  <MousePointer2 size={18} />
                  <span>Select</span>
                </button>
                <div className="toolbar-divider" />
                <button
                  className={`toolbar-btn ${activeTool === 'circle' ? 'active' : ''}`}
                  onClick={() => setActiveTool('circle')}
                  title="Circle Tool (C)"
                >
                  <Circle size={18} />
                  <span>Circle</span>
                </button>
                <button
                  className={`toolbar-btn ${activeTool === 'line' ? 'active' : ''}`}
                  onClick={() => setActiveTool('line')}
                  title="Line Tool (L)"
                >
                  <Line size={18} />
                  <span>Line</span>
                </button>
                <button
                  className={`toolbar-btn ${activeTool === 'polygon' ? 'active' : ''}`}
                  onClick={() => setActiveTool('polygon')}
                  title="Polygon Tool (P)"
                >
                  <PolygonIcon size={18} />
                  <span>Polygon</span>
                </button>
                <div className="toolbar-divider" />
                <button
                  className={`toolbar-btn ${activeTool === 'photoAnchors' ? 'active' : ''}`}
                  onClick={() => setActiveTool('photoAnchors')}
                  title="Photo Anchors (Shift+P)"
                >
                  <Camera size={18} />
                  <span>Photo Points</span>
                </button>
              </div>
              <div className="toolbar-tips">
                {activeTool === 'select' && (
                  <span>Click to select • Drag to move • Delete key removes</span>
                )}
                {activeTool === 'circle' && (
                  <span>Click to place • Drag center to move • Drag handle to resize</span>
                )}
                {activeTool === 'line' && (
                  <span>Click start point • Click end point</span>
                )}
                {activeTool === 'polygon' && (
                  <span>Click to add points • Click first point to close</span>
                )}
                {activeTool === 'photoAnchors' && (
                  <span>Click to place anchor • Shift+click to set target direction</span>
                )}
              </div>
            </div>
          )}

          {/* Drawing status bar */}
          {drawingState.isDrawing && drawingState.points.length > 0 && (
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
                  ? `${drawingState.points.length} points • ${drawingState.points.length >= 3 ? 'Click first point or' : 'Need 3+ points'}`
                  : `${drawingState.points.length}/2 points`}
              </span>
              {activeTool === 'polygon' && drawingState.points.length >= 3 && (
                <button
                  onClick={() => {
                    const newShape: Shape = {
                      id: `shape_${Date.now()}_${Math.random()}`,
                      layerId: selectedLayerId,
                      type: 'polygon',
                      points: drawingState.points,
                      ...(activePlant && {
                        plantId: activePlant.id,
                        plantName: activePlant.commonName,
                        plantScientificName: activePlant.scientificName,
                      }),
                    };
                    handleShapeCreated(newShape);
                    setDrawingState({ isDrawing: false, points: [] });
                  }}
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
                onClick={() => setDrawingState({ isDrawing: false, points: [] })}
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

          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={20}
            style={{ width: '100%', flex: 1 }}
            doubleClickZoom={false}
            scrollWheelZoom={false}
            zoomControl={false}
            minZoom={1}
            maxZoom={24}
          >
            {mapType === 'light' && (
              <TileLayer
                key="light"
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                maxZoom={22}
              />
            )}
            {mapType === 'dark' && (
              <TileLayer
                key="dark"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                maxZoom={22}
              />
            )}
            {mapType === 'street' && (
              <TileLayer
                key="street"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                maxZoom={19}
              />
            )}
            {mapType === 'satellite' && (
              <TileLayer
                key="satellite"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                maxZoom={23}
                maxNativeZoom={19}
              />
            )}

            <MapController
              onMapReady={setLocalMap}
              activeTool={activeTool}
              selectedLayerId={selectedLayerId}
              sidebarMode={sidebarMode}
              activeWaterTool={activeWaterTool}
              waterSelectMode={waterSelectMode}
              activePlant={activePlant}
              onMapClick={handleMapClick}
              drawingState={drawingState}
              setDrawingState={setDrawingState}
              onShapeCreated={handleShapeCreated}
              onZoomChange={setZoomLevel}
              onDeselectWaterFeature={() => setSelectedWaterFeature(null)}
            />

            {/* Boundary */}
            {boundaryPoints.length > 2 && (
              <LeafletPolygon
                positions={boundaryPoints.map(p => [p.lat, p.lng] as [number, number])}
                pathOptions={{
                  fillColor: '#f59e0b',
                  fillOpacity: 0.05,
                  color: '#f59e0b',
                  weight: 2,
                }}
              />
            )}

            {/* Water Feature Markers */}
            {waterFeatures.map(feature => {
              const typeInfo = WATER_FEATURE_TYPES.find(t => t.id === feature.type);
              if (!typeInfo) return null;

              const isWaterSelected = selectedWaterFeature?.id === feature.id;

              // In layers mode: markers are faded and non-interactive so plants can be placed on top
              const isLayersMode = sidebarMode === 'layers';
              const markerOpacity = isLayersMode ? 0.25 : 1;
              const markerPointerEvents = isLayersMode ? 'none' : 'auto';

              return (
                <Marker
                  key={feature.id}
                  position={[feature.position.lat, feature.position.lng]}
                  draggable={waterSelectMode && isWaterSelected}
                  icon={L.divIcon({
                    className: 'water-marker',
                    html: `<div style="width:32px;height:32px;background:${typeInfo.color};border:${isWaterSelected ? '3px solid #fbbf24' : '2px solid white'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:${waterSelectMode ? 'pointer' : 'default'};opacity:${markerOpacity};pointer-events:${markerPointerEvents};${isWaterSelected ? 'box-shadow:0 0 0 4px rgba(251,191,36,0.4);' : ''}">${typeInfo.icon}</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                  })}
                  eventHandlers={{
                    click: (e) => {
                      if (waterSelectMode) {
                        L.DomEvent.stopPropagation(e);
                        setSelectedWaterFeature(feature);
                      }
                    },
                    dragend: (e) => {
                      const newLatLng = e.target.getLatLng();
                      const updatedFeatures = waterFeatures.map(f =>
                        f.id === feature.id
                          ? { ...f, position: { lat: newLatLng.lat, lng: newLatLng.lng } }
                          : f
                      );
                      onWaterFeaturesChange(updatedFeatures);
                      setSelectedWaterFeature({
                        ...feature,
                        position: { lat: newLatLng.lat, lng: newLatLng.lng }
                      });
                    },
                  }}
                />
              );
            })}

            {/* Shapes - sorted by size so larger shapes render first (behind smaller ones) */}
            {[...shapes]
              .sort((a, b) => {
                // Get size for sorting - larger shapes first
                const getSize = (s: Shape) => {
                  if (s.type === 'circle') return s.canopyRadius || s.radius || 5;
                  if (s.type === 'polygon' && s.points) {
                    // Approximate polygon size by bounding box
                    const lats = s.points.map(p => p.lat);
                    const lngs = s.points.map(p => p.lng);
                    return (Math.max(...lats) - Math.min(...lats)) * (Math.max(...lngs) - Math.min(...lngs)) * 10000;
                  }
                  return 1;
                };
                return getSize(b) - getSize(a); // Larger first
              })
              .map(shape => {
                const layer = FOOD_FOREST_LAYERS.find(l => l.id === shape.layerId);
                const isVisible = Boolean(layer && layerVisibility[shape.layerId] !== false);
                if (!layer) return null;

                const isSelected = selectedShape?.id === shape.id;

                // When selecting a shape, switch to its layer but keep current tool
                const handleSelect = () => {
                  // Only select in select mode — drawing modes should draw, not select
                  if (activeTool !== 'select' || placementSuggestion) return;
                  setSelectedShape(shape);
                  switchToLayerFromShape(shape.layerId);
                };

                if (shape.type === 'circle' && shape.center) {
                  return (
                    <EditableCircle
                      key={shape.id}
                      shape={shape}
                      layer={layer}
                      isSelected={isSelected}
                      isVisible={isVisible}
                      activeTool={activeTool}
                      onSelect={handleSelect}
                      onUpdate={(updates) => handleShapeUpdate(shape.id, updates)}
                    />
                  );
                }

                if (shape.type === 'polygon' && shape.points && shape.points.length >= 3) {
                  return (
                    <EditablePolygon
                      key={shape.id}
                      shape={shape}
                      layer={layer}
                      isSelected={isSelected}
                      isVisible={isVisible}
                      activeTool={activeTool}
                      onSelect={handleSelect}
                      onUpdate={(updates) => handleShapeUpdate(shape.id, updates)}
                    />
                  );
                }

                if (shape.type === 'line' && shape.points && shape.points.length >= 2) {
                  return (
                    <EditablePolyline
                      key={shape.id}
                      shape={shape}
                      layer={layer}
                      isSelected={isSelected}
                      isVisible={isVisible}
                      activeTool={activeTool}
                      onSelect={handleSelect}
                      onUpdate={(updates) => handleShapeUpdate(shape.id, updates)}
                    />
                  );
                }

                return null;
              })}

            {/* Photo anchor points and target indicators */}
            {shapes
              .filter(s => s.photoAnchor && s.center && activeTool === 'photoAnchors')
              .map(anchor => (
                <div key={`anchor-group-${anchor.id}`}>
                  {/* Anchor point circle */}
                  <LeafletCircle
                    center={[anchor.center!.lat, anchor.center!.lng]}
                    radius={anchor.canopyRadius || 10}
                    pathOptions={{
                      color: '#3b82f6',
                      fillColor: '#93c5fd',
                      fillOpacity: 0.4,
                      weight: 2,
                    }}
                  >
                    <Tooltip>📷 Photo Anchor</Tooltip>
                  </LeafletCircle>

                  {/* Target direction line */}
                  {anchor.targetPoint && (
                    <LeafletPolyline
                      positions={[
                        [anchor.center!.lat, anchor.center!.lng],
                        [anchor.targetPoint.lat, anchor.targetPoint.lng],
                      ]}
                      pathOptions={{
                        color: '#8b5cf6',
                        weight: 2,
                        dashArray: '5, 5',
                      }}
                    >
                      <Tooltip>🎯 Target Direction</Tooltip>
                    </LeafletPolyline>
                  )}
                </div>
              ))}

            {/* AI Placement suggestion — pulsing zone */}
            {placementSuggestion && (() => {
              const pos = computePlacementPosition(placementSuggestion, shapes);
              if (!pos) return null;
              return (
                <LeafletCircle
                  center={[pos.lat, pos.lng]}
                  radius={3}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#fbbf24',
                    fillOpacity: 0.35,
                    weight: 2,
                    dashArray: '6, 4',
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -6]}>
                    <strong>Suggested: {placementSuggestion.plantName}</strong>
                    <br />{placementSuggestion.direction} of {placementSuggestion.nearPlantName}
                  </Tooltip>
                </LeafletCircle>
              );
            })()}

            {/* Tweak placement — draggable marker */}
            {placementSuggestion && placementMode === 'tweak' && tweakPos && (
              <Marker
                position={[tweakPos.lat, tweakPos.lng]}
                draggable={true}
                icon={L.divIcon({
                  className: 'tweak-placement-marker',
                  html: `<div style="width:28px;height:28px;background:#f59e0b;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:grab;box-shadow:0 0 0 4px rgba(245,158,11,0.35),0 4px 12px rgba(0,0,0,0.4);">🌱</div>`,
                  iconSize: [28, 28],
                  iconAnchor: [14, 14],
                })}
                eventHandlers={{
                  dragend: (e) => {
                    const ll = (e.target as L.Marker).getLatLng();
                    setTweakPos({ lat: ll.lat, lng: ll.lng });
                  },
                }}
              />
            )}

            {/* Drawing preview */}
            {drawingState.isDrawing && currentLayer && (
              <DrawingPreview
                points={drawingState.points}
                activeTool={activeTool}
                layerColor={currentLayer.color}
                onClosePolygon={() => {
                  if (drawingState.points.length >= 3 && selectedLayerId) {
                    const newShape: Shape = {
                      id: `shape_${Date.now()}_${Math.random()}`,
                      layerId: selectedLayerId,
                      type: 'polygon',
                      points: drawingState.points,
                      ...(activePlant && {
                        plantId: activePlant.id,
                        plantName: activePlant.commonName,
                        plantScientificName: activePlant.scientificName,
                      }),
                    };
                    handleShapeCreated(newShape);
                    setDrawingState({ isDrawing: false, points: [] });
                  }
                }}
              />
            )}
          </MapContainer>

          {/* Compass Rose */}
          <div className="compass-rose" title="North is up">
            <div className="compass-n">N</div>
            <div className="compass-middle">
              <span className="compass-w">W</span>
              <span className="compass-dot">✦</span>
              <span className="compass-e">E</span>
            </div>
            <div className="compass-s">S</div>
          </div>

          {/* Zoom Controls */}
          <div className="map-controls zoom-slider-controls">
            <div className="zoom-slider-container">
              <button className="zoom-step-btn" onClick={() => handleZoom('out')} title="Zoom out">
                <ZoomOut size={18} />
              </button>
              <input
                type="range"
                min={1}
                max={22}
                value={zoomLevel}
                onChange={(e) => {
                  const newZoom = parseInt(e.target.value);
                  if (localMap) {
                    localMap.setZoom(newZoom);
                  }
                }}
                className="zoom-slider"
                title={`Zoom: ${zoomLevel}`}
              />
              <button className="zoom-step-btn" onClick={() => handleZoom('in')} title="Zoom in">
                <ZoomIn size={18} />
              </button>
              <span className="zoom-level-display">{zoomLevel}x</span>
            </div>
            <div className="zoom-extra-controls">
              <button onClick={() => handleZoom('fit')} className="map-control-btn" title="Fit to boundary">
                <Maximize2 size={20} />
              </button>
              {(['light', 'dark', 'street', 'satellite'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setMapType(type)}
                  className={`map-control-btn ${mapType === type ? 'active' : ''}`}
                  title={type.charAt(0).toUpperCase() + type.slice(1)}
                >
                  {type === 'light' && <span style={{ fontSize: 13, fontWeight: 700 }}>L</span>}
                  {type === 'dark' && <span style={{ fontSize: 13, fontWeight: 700 }}>D</span>}
                  {type === 'street' && <Map size={16} />}
                  {type === 'satellite' && <Satellite size={16} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confetti burst — positioned at the placed marker's screen coordinates */}
      {confettiPos && (
        <div className="confetti-overlay" style={{ left: confettiPos.x, top: confettiPos.y }}>
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{ '--angle': `${i * 22.5}deg`, '--color': confettiColor } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* AI Placement suggestion card */}
      {placementSuggestion && (
        <div className="placement-suggestion-card">
          <div className="placement-suggestion-header">
            <Sparkles size={16} color="#f59e0b" />
            <strong>{placementMode === 'placed' ? 'Placed ✓' : placementMode === 'tweak' ? 'Drag to Adjust' : 'Suggested Placement'}</strong>
            <button onClick={onClearPlacement} className="placement-dismiss">×</button>
          </div>
          <div className="placement-suggestion-plant">{placementSuggestion.plantName}</div>
          {(placementMode === 'suggest' || placementMode === 'placed') && (
            <>
              <div className="placement-suggestion-meta">
                {placementSuggestion.direction} of {placementSuggestion.nearPlantName}, ~{placementSuggestion.distanceFt}ft
              </div>
              <div className="placement-suggestion-sun">☀️ {placementSuggestion.sunScore}</div>
              <p className="placement-suggestion-reason">{placementSuggestion.reason}</p>
              {placementSuggestion.guildRole && (
                <div className="placement-suggestion-guild">🌿 {placementSuggestion.guildRole}</div>
              )}
            </>
          )}
          {placementMode === 'tweak' && (
            <p className="placement-suggestion-tweak-hint">Drag the marker on the map to your preferred spot.</p>
          )}
          <div className="placement-suggestion-actions">
            {placementMode === 'suggest' && (
              <>
                <button className="placement-btn placement-btn--place" onClick={handlePlaceHere}>
                  Place Here 🎉
                </button>
                <button
                  className="placement-btn placement-btn--tweak"
                  onClick={() => {
                    const pos = computePlacementPosition(placementSuggestion, shapes);
                    setTweakPos(pos);
                    setPlacementMode('tweak');
                  }}
                >
                  Tweak Placement
                </button>
                <button
                  className="placement-btn placement-btn--ask"
                  onClick={() => { onClearPlacement(); onOpenConsultation(); }}
                >
                  Ask a Question
                </button>
              </>
            )}
            {placementMode === 'tweak' && (
              <>
                <button className="placement-btn placement-btn--place" onClick={handlePlaceHere}>
                  Place Here 🎉
                </button>
                <button
                  className="placement-btn placement-btn--ask"
                  onClick={() => { onClearPlacement(); onOpenConsultation(); }}
                >
                  Ask a Question
                </button>
              </>
            )}
            {placementMode === 'placed' && (
              <>
                <p className="placement-resize-hint">Drag the yellow handle to resize. Drag the plant to reposition.</p>
                <button
                  className="placement-btn placement-btn--place"
                  onClick={() => {
                    const plantName = placementSuggestion?.plantName;
                    onClearPlacement();
                    onOpenConsultation(plantName);
                  }}
                >
                  Return to Advisor →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Wizard Welcome Overlay */}
      {showWizard && wizardLayerIndex === -1 && (
        <LayerWizard
          currentLayerIndex={-1}
          onComplete={() => setShowWizard(false)}
          onNext={handleWizardNext}
        />
      )}

      {/* Snapshot Gallery */}
      {showSnapshotGallery && (
        <SnapshotGallery
          projectId={projectId}
          currentShapes={shapes}
          currentGroundcoverSpecies={groundcoverSpecies}
          currentWaterFeatures={waterFeatures}
          onRestore={(restoredShapes, restoredGroundcover, restoredWater) => {
            onShapesChange(restoredShapes);
            onGroundcoverSpeciesChange(restoredGroundcover);
            onWaterFeaturesChange(restoredWater);
          }}
          onClose={() => setShowSnapshotGallery(false)}
        />
      )}
    </div>
  );
}
