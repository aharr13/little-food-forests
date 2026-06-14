// src/components/Plants/PlantCard.tsx
import React from 'react';
import { Plant, GUILD_FUNCTIONS } from '../../types';
import { Sun, CloudRain, Droplets, Leaf } from 'lucide-react';
import './PlantSearch.css';

interface PlantCardProps {
  plant: Plant;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export function PlantCard({ plant, onClick, selected, compact }: PlantCardProps) {
  const sunIcon = {
    'full-sun': <Sun size={14} className="icon-sun" />,
    'partial-shade': <CloudRain size={14} className="icon-partial" />,
    'full-shade': <Leaf size={14} className="icon-shade" />,
  };

  const waterIcon = {
    low: <Droplets size={14} className="icon-low" />,
    moderate: <Droplets size={14} className="icon-moderate" />,
    high: <Droplets size={14} className="icon-high" />,
  };

  const guildIcons = plant.guildFunctions.map(func => {
    const guildInfo = GUILD_FUNCTIONS.find(g => g.id === func);
    return guildInfo ? (
      <span key={func} className="guild-badge" title={guildInfo.name}>
        {guildInfo.icon}
      </span>
    ) : null;
  });

  if (compact) {
    return (
      <button
        className={`plant-card compact ${selected ? 'selected' : ''}`}
        onClick={onClick}
      >
        <div className="plant-card-header">
          <span className="plant-name">{plant.commonName}</span>
          <div className="plant-icons">
            {sunIcon[plant.sunRequirement]}
            {waterIcon[plant.waterRequirement]}
          </div>
        </div>
        <span className="plant-scientific">{plant.scientificName}</span>
        {guildIcons.length > 0 && (
          <div className="plant-guilds">{guildIcons}</div>
        )}
      </button>
    );
  }

  return (
    <button
      className={`plant-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="plant-card-header">
        <div className="plant-names">
          <span className="plant-name">{plant.commonName}</span>
          <span className="plant-scientific">{plant.scientificName}</span>
        </div>
        <div className="plant-icons">
          {sunIcon[plant.sunRequirement]}
          {waterIcon[plant.waterRequirement]}
        </div>
      </div>
      <p className="plant-description">{plant.description}</p>
      <div className="plant-meta">
        {guildIcons.length > 0 && (
          <div className="plant-guilds">{guildIcons}</div>
        )}
        {plant.matureHeight && (
          <span className="plant-size">
            {plant.matureHeight}ft tall
            {plant.matureSpread && ` × ${plant.matureSpread}ft wide`}
          </span>
        )}
      </div>
      {plant.edible && <span className="edible-badge">Edible</span>}
      {plant.nativeToTexas && <span className="native-badge">TX Native</span>}
    </button>
  );
}
