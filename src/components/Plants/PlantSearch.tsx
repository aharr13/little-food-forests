// src/components/Plants/PlantSearch.tsx
import { useState } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { Plant, GuildFunction, GUILD_FUNCTIONS, FOOD_FOREST_LAYERS } from '../../types';
import { usePlants } from '../../hooks/usePlants';
import { PlantCard } from './PlantCard';
import './PlantSearch.css';

interface PlantSearchProps {
  // layerId/currentLayerId/onLayerSwitch are kept for compatibility but the
  // search now spans ALL layers; selecting a plant switches to its own layer.
  layerId?: string;
  onSelectPlant: (plant: Plant, switchToLayer?: string) => void;
  onClose: () => void;
  selectedPlantId?: string;
  currentLayerId?: string;
  onLayerSwitch?: (layerId: string) => void;
}

export function PlantSearch({
  onSelectPlant,
  onClose,
  selectedPlantId,
}: PlantSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuildFilters, setActiveGuildFilters] = useState<GuildFunction[]>([]);

  // Search across EVERY plant, regardless of which layer is currently selected.
  const { filteredPlants, loading, error } = usePlants({
    searchQuery,
    guildFilter: activeGuildFilters.length > 0 ? activeGuildFilters : undefined,
  });

  function toggleGuildFilter(guildId: GuildFunction) {
    setActiveGuildFilters(prev =>
      prev.includes(guildId)
        ? prev.filter(g => g !== guildId)
        : [...prev, guildId]
    );
  }

  function layerNameFor(plant: Plant): string {
    const layer = FOOD_FOREST_LAYERS.find(l => plant.layerTypes.includes(l.id));
    return layer?.name || plant.layerTypes[0] || '';
  }

  // Selecting a plant always switches to that plant's primary layer.
  function selectPlant(plant: Plant) {
    onSelectPlant(plant, plant.layerTypes[0]);
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
          placeholder="Search all plants..."
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
        ) : filteredPlants.length === 0 ? (
          <div className="plant-empty">
            No plants match your search.
          </div>
        ) : (
          filteredPlants.map(plant => (
            <div key={plant.id} className="plant-row">
              <PlantCard
                plant={plant}
                selected={plant.id === selectedPlantId}
                onClick={() => selectPlant(plant)}
                compact
              />
              <span className="plant-row-layer">{layerNameFor(plant)}</span>
            </div>
          ))
        )}
      </div>

      <div className="plant-count">
        {filteredPlants.length} plant{filteredPlants.length !== 1 ? 's' : ''} — selecting one switches to its layer
      </div>
    </div>
  );
}
