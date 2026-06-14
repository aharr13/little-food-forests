# Canvas Drawing System - Context for AI

## Current Implementation

**File Structure:**
- `src/components/Canvas/types.ts` - 8 layers, shape types, interfaces
- `src/components/Canvas/CanvasDrawing.tsx` - Drawing engine (circle/line/polygon tools)
- `src/components/Canvas/LayerWizard.tsx` - First-time user education
- `src/components/Canvas/LayersScreen.tsx` - Main container, integrates everything
- `src/App.tsx` - Step 4 renders LayersScreen

**Current Colors (EXACT):**
- Canopy: #28594C, Understory: #2A7A3C, Shrub: #78C443, Herbaceous: #fbbf24
- Groundcover: #B7EBD1, Rhizosphere: #F54927, Vine: #AE92C9, Infrastructure: #000000

**Shape System:**
- Circle: Click to place, drag edge to resize, drag center to move
- Line: Click start, click end (2 points)
- Polygon: Click points, double-click to finish
- Trees (canopy/understory): Show trunk (inner circle) + canopy (outer circle)

**Current Issues:**
1. Wizard welcome overlay cuts off top/bottom - can't see full content
2. Map not visible during wizard - LayersScreen not rendering GoogleMap when wizard active
3. [Add issues as you find them]

## When Debugging Canvas Issues

**Check these files:**
- LayersScreen.tsx - Controls wizard visibility and map rendering
- CanvasDrawing.tsx - Handles shape drawing and coordinate conversion
- types.ts - Verify layer colors match spec

**Common Problems:**
- Coordinate conversion (latLngToPixel/pixelToLatLng) - affects shape placement
- Z-index issues - canvas must be above map, below controls
- Layer visibility state - affects shape opacity and clickability
- Drawing mode state - must be ON to draw, OFF to pan map

## Project Goals
See MISSION_AND_ROADMAP.md for full vision. Current focus: Phase 1 MVP - prove drawing system works, get it demo-ready.
```

## Prompt Template for Claude in VS Code

When you have issues, use this format:
```
Context: Working on Little Food Forests canvas drawing system (see CANVAS_CONTEXT.md)

Issue: [Describe what's wrong]
- Wizard welcome screen is cut off, can't see top/bottom
- No map visible during wizard layers

Expected: [What should happen]
- Full wizard content visible with scroll if needed
- Map should be visible behind/beside wizard

Current behavior: [What actually happens]
- Content overflow hidden
- Map div not rendering when wizard active

Files involved:
- src/components/Canvas/LayerWizard.tsx (wizard overlay)
- src/components/Canvas/LayersScreen.tsx (map + wizard container)

Please provide fix with explanation.