// src/components/Plants/GuildAnalysis.tsx
import React, { useMemo } from 'react';
import { Check, X, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { Shape, Plant, GuildFunction, GUILD_FUNCTIONS, Point } from '../../types';
import { usePlants } from '../../hooks/usePlants';
import './GuildAnalysis.css';

interface GuildAnalysisProps {
  anchorShape: Shape;
  allShapes: Shape[];
  onSelectPlant: (plant: Plant) => void;
}

// Calculate distance between two lat/lng points in feet
function getDistanceFeet(p1: Point, p2: Point): number {
  const R = 20902231; // Earth's radius in feet
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get center point of a shape
function getShapeCenter(shape: Shape): Point | null {
  if (shape.center) return shape.center;
  if (shape.points && shape.points.length > 0) {
    const sumLat = shape.points.reduce((sum, p) => sum + p.lat, 0);
    const sumLng = shape.points.reduce((sum, p) => sum + p.lng, 0);
    return {
      lat: sumLat / shape.points.length,
      lng: sumLng / shape.points.length,
    };
  }
  return null;
}

export function GuildAnalysis({ anchorShape, allShapes, onSelectPlant }: GuildAnalysisProps) {
  const { plants, loading } = usePlants({});

  // Get the anchor's center and search radius
  const anchorCenter = getShapeCenter(anchorShape);
  const searchRadiusFeet = (anchorShape.canopyRadius || 15) * 2; // 2x canopy radius

  // Find nearby shapes with assigned plants
  const nearbyPlantData = useMemo(() => {
    if (!anchorCenter || plants.length === 0) return [];

    const nearby: { shape: Shape; plant: Plant; distance: number }[] = [];

    for (const shape of allShapes) {
      if (shape.id === anchorShape.id) continue; // Skip the anchor itself
      if (!shape.plantId) continue; // Skip shapes without plants

      const shapeCenter = getShapeCenter(shape);
      if (!shapeCenter) continue;

      const distance = getDistanceFeet(anchorCenter, shapeCenter);
      if (distance <= searchRadiusFeet) {
        const plant = plants.find(p => p.id === shape.plantId);
        if (plant) {
          nearby.push({ shape, plant, distance });
        }
      }
    }

    return nearby.sort((a, b) => a.distance - b.distance);
  }, [anchorCenter, allShapes, anchorShape.id, plants, searchRadiusFeet]);

  // Analyze guild functions present
  const guildAnalysis = useMemo(() => {
    const analysis: Record<GuildFunction, { present: boolean; providers: string[] }> = {
      'nitrogen-fixer': { present: false, providers: [] },
      'dynamic-accumulator': { present: false, providers: [] },
      'insectary': { present: false, providers: [] },
      'mulch-producer': { present: false, providers: [] },
      'pest-confuser': { present: false, providers: [] },
    };

    // Check the anchor plant itself
    const anchorPlant = plants.find(p => p.id === anchorShape.plantId);
    if (anchorPlant) {
      for (const func of anchorPlant.guildFunctions) {
        if (analysis[func]) {
          analysis[func].present = true;
          analysis[func].providers.push(anchorPlant.commonName + ' (anchor)');
        }
      }
    }

    // Check nearby plants
    for (const { plant } of nearbyPlantData) {
      for (const func of plant.guildFunctions) {
        if (analysis[func]) {
          analysis[func].present = true;
          if (!analysis[func].providers.includes(plant.commonName)) {
            analysis[func].providers.push(plant.commonName);
          }
        }
      }
    }

    return analysis;
  }, [nearbyPlantData, plants, anchorShape.plantId]);

  // Find missing functions
  const missingFunctions = GUILD_FUNCTIONS.filter(
    gf => !guildAnalysis[gf.id].present
  );

  // Get suggestions for missing functions
  const suggestions = useMemo(() => {
    if (missingFunctions.length === 0) return [];

    const suggestedPlants: { plant: Plant; fills: GuildFunction[] }[] = [];

    for (const plant of plants) {
      // Skip if it's already the anchor or nearby
      if (plant.id === anchorShape.plantId) continue;
      if (nearbyPlantData.some(n => n.plant.id === plant.id)) continue;

      // Check which missing functions this plant fills
      const fills = plant.guildFunctions.filter(
        func => missingFunctions.some(mf => mf.id === func)
      );

      if (fills.length > 0) {
        suggestedPlants.push({ plant, fills });
      }
    }

    // Sort by number of functions filled (descending), then by name
    return suggestedPlants
      .sort((a, b) => b.fills.length - a.fills.length || a.plant.commonName.localeCompare(b.plant.commonName))
      .slice(0, 6); // Top 6 suggestions
  }, [missingFunctions, plants, anchorShape.plantId, nearbyPlantData]);

  const coveredCount = GUILD_FUNCTIONS.length - missingFunctions.length;
  const healthPercent = Math.round((coveredCount / GUILD_FUNCTIONS.length) * 100);

  if (loading) {
    return (
      <div className="guild-analysis loading">
        <span>Analyzing guild...</span>
      </div>
    );
  }

  return (
    <div className="guild-analysis">
      <div className="guild-header">
        <Sparkles size={18} />
        <h4>Guild Health</h4>
        <span className={`health-badge ${healthPercent === 100 ? 'complete' : healthPercent >= 60 ? 'good' : 'needs-work'}`}>
          {healthPercent}%
        </span>
      </div>

      <div className="guild-radius-info">
        Analyzing plants within {Math.round(searchRadiusFeet)} ft
      </div>

      <div className="guild-functions-list">
        {GUILD_FUNCTIONS.map(gf => {
          const analysis = guildAnalysis[gf.id];
          return (
            <div key={gf.id} className={`guild-function-row ${analysis.present ? 'covered' : 'missing'}`}>
              <span className="guild-function-icon">{gf.icon}</span>
              <span className="guild-function-name">{gf.name}</span>
              {analysis.present ? (
                <Check size={16} className="status-icon covered" />
              ) : (
                <X size={16} className="status-icon missing" />
              )}
              {analysis.present && analysis.providers.length > 0 && (
                <span className="providers-tooltip" title={analysis.providers.join(', ')}>
                  {analysis.providers.length} plant{analysis.providers.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {missingFunctions.length > 0 && (
        <div className="guild-suggestions">
          <div className="suggestions-header">
            <AlertCircle size={14} />
            <span>Add to complete your guild:</span>
          </div>
          <div className="suggestions-list">
            {suggestions.map(({ plant, fills }) => (
              <button
                key={plant.id}
                className="suggestion-btn"
                onClick={() => onSelectPlant(plant)}
              >
                <div className="suggestion-info">
                  <span className="suggestion-name">{plant.commonName}</span>
                  <span className="suggestion-fills">
                    {fills.map(f => GUILD_FUNCTIONS.find(gf => gf.id === f)?.icon).join(' ')}
                  </span>
                </div>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {missingFunctions.length === 0 && (
        <div className="guild-complete">
          <Check size={16} />
          <span>Guild complete! All functions covered.</span>
        </div>
      )}

      {nearbyPlantData.length > 0 && (
        <div className="nearby-summary">
          <span className="nearby-count">{nearbyPlantData.length} companion plant{nearbyPlantData.length > 1 ? 's' : ''} nearby</span>
        </div>
      )}
    </div>
  );
}
