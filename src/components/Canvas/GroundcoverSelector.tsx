// src/components/Canvas/GroundcoverSelector.tsx
import React from 'react';
import { Sprout, Sun, CloudSun, Cloud, Zap, Leaf } from 'lucide-react';
import { GROUNDCOVER_SPECIES, GroundcoverSpecies } from '../../types';
import './GroundcoverSelector.css';

interface GroundcoverSelectorProps {
  selectedSpecies: string[];
  onSpeciesChange: (species: string[]) => void;
}

export function GroundcoverSelector({ selectedSpecies, onSpeciesChange }: GroundcoverSelectorProps) {
  function toggleSpecies(speciesId: string) {
    if (selectedSpecies.includes(speciesId)) {
      onSpeciesChange(selectedSpecies.filter(id => id !== speciesId));
    } else {
      onSpeciesChange([...selectedSpecies, speciesId]);
    }
  }

  function getSunIcon(sun: GroundcoverSpecies['sunRequirements']) {
    switch (sun) {
      case 'full-sun': return <Sun size={14} />;
      case 'partial-shade': return <CloudSun size={14} />;
      case 'full-shade': return <Cloud size={14} />;
      case 'any': return <Sun size={14} />;
    }
  }

  function getSpreadIcon(spread: GroundcoverSpecies['spreadRate']) {
    switch (spread) {
      case 'fast': return <Zap size={14} className="spread-fast" />;
      case 'moderate': return <Zap size={14} className="spread-moderate" />;
      case 'slow': return <Zap size={14} className="spread-slow" />;
    }
  }

  return (
    <div className="groundcover-selector">
      <div className="groundcover-intro">
        <Sprout size={20} color="#B7EBD1" />
        <p>
          Select groundcover species for your food forest. These low-growing plants
          will fill spaces between your other plantings.
        </p>
      </div>

      <div className="species-list">
        {GROUNDCOVER_SPECIES.map(species => {
          const isSelected = selectedSpecies.includes(species.id);
          return (
            <div
              key={species.id}
              className={`species-item ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleSpecies(species.id)}
            >
              <div className="species-checkbox">
                {isSelected && <span className="checkmark">✓</span>}
              </div>
              <div className="species-content">
                <div className="species-header">
                  <span className="species-name">{species.name}</span>
                  {species.edible && (
                    <span className="edible-badge" title="Edible">
                      <Leaf size={12} /> Edible
                    </span>
                  )}
                </div>
                <span className="species-scientific">{species.scientificName}</span>
                <p className="species-description">{species.description}</p>
                <div className="species-traits">
                  <span className="trait" title={`Sun: ${species.sunRequirements.replace('-', ' ')}`}>
                    {getSunIcon(species.sunRequirements)}
                    <span>{species.sunRequirements.replace('-', ' ')}</span>
                  </span>
                  <span className="trait" title={`Spread rate: ${species.spreadRate}`}>
                    {getSpreadIcon(species.spreadRate)}
                    <span>{species.spreadRate}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedSpecies.length > 0 && (
        <div className="selected-summary">
          <strong>{selectedSpecies.length}</strong> species selected
        </div>
      )}
    </div>
  );
}
