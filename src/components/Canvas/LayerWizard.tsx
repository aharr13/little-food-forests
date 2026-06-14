// src/components/Canvas/LayerWizard.tsx
import React from 'react';
import { FOOD_FOREST_LAYERS } from '../../types';
import { Check } from 'lucide-react';
import './LayerWizard.css';

interface LayerWizardProps {
  currentLayerIndex: number;
  onComplete: () => void;
  onNext: () => void;
}

export function LayerWizard({ currentLayerIndex, onComplete, onNext }: LayerWizardProps) {
  const currentLayer = FOOD_FOREST_LAYERS[currentLayerIndex];
  const isFirstLayer = currentLayerIndex === 0;
  const isLastLayer = currentLayerIndex === FOOD_FOREST_LAYERS.length - 1;

  if (currentLayerIndex === -1) {
    // Welcome screen
    return (
      <div className="wizard-overlay">
        <div className="wizard-card">
          <h2>🌱 Let's Map Your Existing Plants!</h2>
          <p>
            Before we design new plantings, we need to understand what's already growing 
            on your property. This helps us make smart recommendations that work with 
            your existing landscape.
          </p>
          
          <div className="wizard-steps">
            <div className="wizard-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Identify your plants</strong>
                <p>Use a plant ID app like Seek or Picture This to identify what you have</p>
              </div>
            </div>
            
            <div className="wizard-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Map layer by layer</strong>
                <p>We'll guide you through each layer, from tallest trees to groundcover</p>
              </div>
            </div>
            
            <div className="wizard-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <strong>Get AI recommendations</strong>
                <p>Based on your map, we'll suggest complementary plants</p>
              </div>
            </div>
          </div>

          <button className="wizard-btn-primary" onClick={onNext}>
            Start Mapping →
          </button>

          <button
            className="wizard-btn-skip"
            onClick={onComplete}
            style={{ marginTop: '1rem' }}
          >
            Skip to Editing
          </button>
        </div>
      </div>
    );
  }

  const Icon = currentLayer.icon;

  return (
    <div className="wizard-sidebar-card">
      <div className="wizard-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentLayerIndex + 1) / FOOD_FOREST_LAYERS.length) * 100}%` }}
          />
        </div>
        <span className="progress-text">
          Layer {currentLayerIndex + 1} of {FOOD_FOREST_LAYERS.length}
        </span>
      </div>

      <div className="wizard-layer-info">
        <div className="layer-icon" style={{ backgroundColor: currentLayer.color + '20' }}>
          <Icon size={32} color={currentLayer.color} />
        </div>
        
        <h3>{currentLayer.name} Layer</h3>
        <p className="layer-description">{currentLayer.description}</p>
      </div>

      <div className="wizard-instructions">
        <h4>What to map:</h4>
        {currentLayerIndex === 0 && (
          <ul>
            <li>Existing tall trees (20-40ft or taller)</li>
            <li>Click on map to place each tree</li>
            <li>Drag edge to match actual canopy size</li>
            <li>Drag center to reposition if needed</li>
          </ul>
        )}
        {currentLayerIndex === 1 && (
          <ul>
            <li>Smaller trees (10-20ft tall)</li>
            <li>Trees growing under the canopy</li>
            <li>Young fruit trees, ornamentals</li>
          </ul>
        )}
        {currentLayerIndex === 2 && (
          <ul>
            <li>Woody bushes (3-10ft tall)</li>
            <li>Berry bushes, shrubby plants</li>
            <li>Anything with permanent woody stems</li>
          </ul>
        )}
        {currentLayerIndex === 3 && (
          <ul>
            <li>Perennial herbs and vegetables</li>
            <li>Plants that die back in winter</li>
            <li>Non-woody stems</li>
          </ul>
        )}
        {currentLayerIndex === 4 && (
          <ul>
            <li>Low spreading plants covering the ground</li>
            <li>Grass, clover, creeping plants</li>
            <li>Use polygon tool to outline areas</li>
          </ul>
        )}
        {currentLayerIndex === 5 && (
          <ul>
            <li>Root vegetables and deep-rooted plants</li>
            <li>Carrots, potatoes, comfrey</li>
            <li>Plants that mine nutrients from deep soil</li>
          </ul>
        )}
        {currentLayerIndex === 6 && (
          <ul>
            <li>Climbing plants on structures or trees</li>
            <li>Grapes, beans, climbing roses</li>
            <li>Use line tool for vertical growth paths</li>
          </ul>
        )}
        {currentLayerIndex === 7 && (
          <ul>
            <li>Paths, fences, raised beds</li>
            <li>Sheds, greenhouses, structures</li>
            <li>Water features, irrigation lines</li>
          </ul>
        )}
      </div>

      <div className="wizard-actions">
        <button className="wizard-btn-done" onClick={onNext}>
          <Check size={18} />
          {isLastLayer ? "Finish Mapping" : `Done with ${currentLayer.name}`}
        </button>
        
        {!isFirstLayer && (
          <button className="wizard-btn-skip" onClick={onNext}>
            Skip this layer
          </button>
        )}
      </div>

      <div className="wizard-tip">
        💡 <strong>Tip:</strong> Don't worry about being perfect. You can always come back and adjust later.
      </div>
    </div>
  );
}