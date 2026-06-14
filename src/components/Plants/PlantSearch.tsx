// src/components/Plants/PlantSearch.tsx
import React, { useState } from 'react';
import { Search, X, Loader, ArrowRight } from 'lucide-react';
import { Plant, GuildFunction, GUILD_FUNCTIONS, FOOD_FOREST_LAYERS } from '../../types';
import { usePlants } from '../../hooks/usePlants';
import { PlantCard } from './PlantCard';
import './PlantSearch.css';

interface PlantSearchProps {
  layerId: string;
  onSelectPlant: (plant: Plant, switchToLayer?: string) => void;
  onClose: () => void;
  selectedPlantId?: string;
  currentLayerId?: string;
  onLayerSwitch?: (layerId: string) => void;
}

export function PlantSearch({
  layerId,
  onSelectPlant,
  onClose,
  selectedPlantId,
  currentLayerId,
  onLayerSwitch
}: PlantSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuildFilters, setActiveGuildFilters] = useState<GuildFunction[]>([]);

  // Get plants for current layer
  const { filteredPlants, loading, error } = usePlants({
    layerFilter: layerId,
    searchQuery,
    guildFilter: activeGuildFilters.length > 0 ? activeGuildFilters : undefined,
  });

  // Get ALL plants (for cross-layer search suggestions)
  const { filteredPlants: allFilteredPlants } = usePlants({
    searchQuery,
    guildFilter: activeGuildFilters.length > 0 ? activeGuildFilters : undefined,
  });

  // Plants from other layers that match the search
  const otherLayerPlants = searchQuery.trim()
    ? allFilteredPlants.filter(p => !p.layerTypes.includes(layerId))
    : [];

  function toggleGuildFilter(guildId: GuildFunction) {
    setActiveGuildFilters(prev =>
      prev.includes(guildId)
        ? prev.filter(g => g !== guildId)
        : [...prev, guildId]
    );
  }

  function getLayerName(layerIds: string[]): string {
    const layer = FOOD_FOREST_LAYERS.find(l => layerIds.includes(l.id));
    return layer?.name || layerIds[0];
  }

  function handleSelectOtherLayerPlant(plant: Plant) {
    // Find the first layer this plant belongs to
    const targetLayer = plant.layerTypes[0];
    onSelectPlant(plant, targetLayer);
  }

  return (
    <div className="plant-search">
      <div className="plant-search-header">
        <h3>Select Plant</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="plant-search-input">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search plants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        {searchQuery && (
          <button className="clear-btn" onClick={() => setSearchQuery('')}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="guild-filters">
        {GUILD_FUNCTIONS.map(guild => (
          <button
            key={guild.id}
            className={`guild-filter ${activeGuildFilters.includes(guild.id) ? 'active' : ''}`}
            onClick={() => toggleGuildFilter(guild.id)}
            title={guild.description}
          >
            <span className="guild-icon">{guild.icon}</span>
            <span className="guild-name">{guild.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="plant-list">
        {loading ? (
          <div className="plant-loading">
            <Loader size={24} className="spinner" />
            <span>Loading plants...</span>
          </div>
        ) : error ? (
          <div className="plant-error">{error}</div>
        ) : (
          <>
            {/* Current layer plants */}
            {filteredPlants.length === 0 && !searchQuery ? (
              <div className="plant-empty">
                No plants available for this layer yet.
              </div>
            ) : filteredPlants.length === 0 && searchQuery ? (
              <div className="plant-empty">
                No plants found in this layer.
              </div>
            ) : (
              filteredPlants.map(plant => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  selected={plant.id === selectedPlantId}
                  onClick={() => onSelectPlant(plant)}
                  compact
                />
              ))
            )}

            {/* Cross-layer suggestions */}
            {searchQuery && otherLayerPlants.length > 0 && (
              <div className="other-layer-section">
                <div className="other-layer-header">
                  Found in other layers:
                </div>
                {otherLayerPlants.slice(0, 5).map(plant => (
                  <div key={plant.id} className="other-layer-plant">
                    <PlantCard
                      plant={plant}
                      selected={false}
                      onClick={() => handleSelectOtherLayerPlant(plant)}
                      compact
                    />
                    <button
                      className="switch-layer-btn"
                      onClick={() => handleSelectOtherLayerPlant(plant)}
                    >
                      <span>Switch to {getLayerName(plant.layerTypes)}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="plant-count">
        {filteredPlants.length} plant{filteredPlants.length !== 1 ? 's' : ''} in this layer
      </div>
    </div>
  );
}
