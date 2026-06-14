// src/components/Canvas/WaterTopography.tsx
import React from 'react';
import { Droplets, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { WaterFeature, WaterFeatureType, WATER_FEATURE_TYPES } from '../../types';
import './WaterTopography.css';

interface WaterTopographyProps {
  waterFeatures: WaterFeature[];
  onWaterFeaturesChange: (features: WaterFeature[]) => void;
  activeWaterTool: WaterFeatureType | null;
  onActiveWaterToolChange: (tool: WaterFeatureType | null) => void;
}

export function WaterTopography({
  waterFeatures,
  onWaterFeaturesChange,
  activeWaterTool,
  onActiveWaterToolChange,
}: WaterTopographyProps) {

  function deleteFeature(id: string) {
    onWaterFeaturesChange(waterFeatures.filter(f => f.id !== id));
  }

  function clearAllFeatures() {
    if (confirm('Remove all water & topography markers?')) {
      onWaterFeaturesChange([]);
    }
  }

  // Count features by type
  const featureCounts = WATER_FEATURE_TYPES.reduce((acc, type) => {
    acc[type.id] = waterFeatures.filter(f => f.type === type.id).length;
    return acc;
  }, {} as Record<WaterFeatureType, number>);

  return (
    <div className="water-topography">
      <div className="water-description">
        <Droplets size={20} color="#3b82f6" />
        <p>Mark key water flow points to help plan drainage and plant placement.</p>
      </div>

      <div className="water-tools">
        {WATER_FEATURE_TYPES.map(type => {
          const isActive = activeWaterTool === type.id;
          const count = featureCounts[type.id];

          return (
            <button
              key={type.id}
              className={`water-tool-btn ${isActive ? 'active' : ''}`}
              onClick={() => onActiveWaterToolChange(isActive ? null : type.id)}
              style={{
                borderColor: isActive ? type.color : undefined,
                background: isActive ? `${type.color}15` : undefined,
              }}
            >
              <span className="water-tool-icon" style={{ fontSize: '1.25rem' }}>
                {type.icon}
              </span>
              <div className="water-tool-info">
                <span className="water-tool-name">{type.name}</span>
                {count > 0 && (
                  <span className="water-tool-count" style={{ color: type.color }}>
                    {count} marked
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {activeWaterTool && (
        <div className="water-instruction">
          <strong>Click on the map</strong> to place a {WATER_FEATURE_TYPES.find(t => t.id === activeWaterTool)?.name.toLowerCase()} marker.
        </div>
      )}

      {waterFeatures.length > 0 && (
        <div className="water-features-list">
          <h4>Marked Points ({waterFeatures.length})</h4>
          <div className="water-features-items">
            {waterFeatures.map(feature => {
              const typeInfo = WATER_FEATURE_TYPES.find(t => t.id === feature.type);
              if (!typeInfo) return null;

              return (
                <div key={feature.id} className="water-feature-item">
                  <span className="water-feature-icon">{typeInfo.icon}</span>
                  <span className="water-feature-name">{typeInfo.name}</span>
                  <button
                    className="water-feature-delete"
                    onClick={() => deleteFeature(feature.id)}
                    title="Remove marker"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          <button className="water-clear-btn" onClick={clearAllFeatures}>
            Clear All Markers
          </button>
        </div>
      )}

      <div className="water-tips">
        <h4>Tips</h4>
        <ul>
          <li><ArrowUp size={14} /> <strong>High points</strong> are where water flows FROM</li>
          <li><ArrowDown size={14} /> <strong>Low points</strong> are where water flows TO</li>
          <li><Droplets size={14} /> <strong>Pooling areas</strong> stay wet longest after rain</li>
        </ul>
      </div>
    </div>
  );
}
