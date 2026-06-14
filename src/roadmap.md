# Little Food Forests - Project Roadmap & AI Collaboration Guide
cd /mnt/c/Users/aharr/Desktop/little-food-forests

## Project Vision

**Mission**: Create an accessible web app that helps everyday people design and implement regenerative food forests in their own yards, regardless of gardening experience.

**Core Philosophy**: 
- **Education-first**: Teach permaculture principles while users design
- **Step-by-step guidance**: Break complex ecological design into manageable steps
- **Location-specific**: Native plants and climate-appropriate recommendations
- **Project management**: Guide users from planning through implementation over months/years

---

## Product Overview

### What It Does
1. **Site Mapping**: Users trace their property boundary and mark existing features
2. **Intelligent Design**: AI suggests complementary native plants based on location, sun/shade, water patterns
3. **Layer-Based Planning**: Organize plants by food forest layers (canopy → groundcover)
4. **Project Management**: Break design into actionable tasks with timing, instructions, and education
5. **Learning Platform**: Teach regenerative agriculture and permaculture concepts contextually

### Target User
- Homeowners with yards (urban, suburban, rural)
- Little to no permaculture knowledge
- Want to grow food sustainably
- Need guidance and encouragement through the process
- May be intimidated by traditional gardening

---

## Technical Stack

### Current Implementation
- **Frontend**: React + TypeScript (Vite)
- **Mapping**: Google Maps API (satellite view for tracing)
- **Styling**: Custom CSS (clean, nature-inspired green palette)
- **Database**: Firestore (for now - may migrate later)
- **AI**: Claude API (for plant recommendations and education)

### Future Considerations
- **Topography Data**: USGS elevation data for water flow analysis
- **Solar Calculations**: Sun path algorithms for shade mapping
- **Plant Database**: USDA PLANTS database + curated guild relationships
- **User Auth**: Firebase Auth (already integrated with Firestore)

---

## Development Roadmap

### ✅ COMPLETED: Phase 0 - Foundation
**Goal**: Prove the core concept works

**Features Built**:
- [x] Welcome screen with clear value proposition
- [x] Address search with geocoding
- [x] Click-to-trace boundary drawing with visual feedback
- [x] Step-by-step wizard flow (Welcome → Address → Boundary → Layers)
- [x] Clean, intuitive UI with proper user feedback
- [x] Visual markers and lines for boundary tracing
- [x] Disabled states and validation (minimum 3 corners, etc.)
- [x] Firebase Auth (login/signup/logout)
- [x] Firestore project persistence with auto-save
- [x] Dashboard with project list

---

### ✅ COMPLETED: Phase 1, Milestone 1.1 - Custom Drawing Interface
**Goal**: Full interactive plant mapping canvas

**Features Built**:
- [x] Switched from Google Maps to React-Leaflet (satellite + 3 base map styles)
- [x] 8 food forest layers with color coding (Canopy → Vine → Infrastructure)
- [x] Circle tool with trunk + canopy visualization (trees show both)
- [x] Line tool and Polygon tool (click to add points, click first point to close)
- [x] Select/move/resize shapes — separate from drawing modes
- [x] Center handles on all shapes (grab in any mode, hover shows plant name)
- [x] Layer visibility toggles (show/hide individual layers)
- [x] Zoom slider + step buttons + fit-to-boundary
- [x] Multiple map styles: Light, Dark, Street, Satellite
- [x] Water & Topography tab (place/select/move/delete water markers)
- [x] Groundcover species selector
- [x] Save Snapshot functionality
- [x] Keyboard shortcuts (Delete to remove, Escape to cancel)
- [x] Layer Wizard for guided onboarding

---

### ✅ COMPLETED: Phase 1, Milestone 1.2 (Partial) - Plant Database & Guild Analysis
**Goal**: Help users understand plant relationships

**Features Built**:
- [x] Plant database in Firestore (Texas native + adapted species)
- [x] Plant search with layer, text, and guild function filters
- [x] Plant cards with sun/water/size/edibility info
- [x] Assign plants to shapes (active brush + per-shape)
- [x] Cross-layer plant suggestions in search
- [x] Guild analysis panel for selected canopy/understory trees:
  - Scans nearby plants within 2x canopy radius
  - Shows which of 5 guild functions are covered vs. missing
  - Suggests plants to fill missing roles
  - Click suggestion → sets as active brush + switches layer
- [x] Hover tooltip on center handles shows plant name + scientific name

**Still Needed**:
- [ ] AI Consultation screen (conversational onboarding → plant recommendations)
- [ ] Guided placement after consultation (Claude suggests where to plant)

---

### ✅ COMPLETED: Wiki & Learning Platform
- [x] Wiki with articles grouped by category
- [x] Markdown rendering with related articles
- [x] Admin panel for creating/editing/publishing articles
- [x] Role-based access (admin email whitelist)

---

### 🔨 IN PROGRESS: Phase 1, Milestone 1.2 (Remaining) - AI Consultation
**Goal**: Conversational Claude-powered onboarding that fills user profile naturally

**Planned Flow**:
1. User maps existing plants on canvas
2. Opens AI Consultation screen (dedicated screen/modal)
3. Claude reviews existing plants, asks questions about vision, goals, site conditions, effort level
4. User profile filled conversationally (no boring forms)
5. Claude confirms plan, prioritizes plants that complete existing guilds
6. Suggests plants by layer with effort/time-to-establish ranking
7. User approves list → moves to guided placement on map

**Technical Requirements**:
- Anthropic API key (separate from Claude.ai subscription — get at console.anthropic.com)
- `@anthropic-ai/sdk` npm package
- API key in `.env` as `VITE_ANTHROPIC_API_KEY`
- Recommended: Haiku for conversation turns, Opus for final recommendations
- Estimated cost: ~$0.005–$0.025 per user session

---

### 🔨 IN PROGRESS → MOSTLY COMPLETE: Phase 1, Milestone 1.3 - Project Plan & Task Manager
**Goal**: Guide users from design through implementation

**Completed Features:**
- ✅ Generate task timeline from finalized design (PlantingTasks generated from shapes)
- ✅ Tasks include: what, when, why, estimated time (stored in each task)
- ✅ Mark tasks complete as user progresses (with checkbox UI and XP tracking)
- ✅ Recurring care items for establishing plants (CareItems with intervals)
- ✅ Reschedule/snooze tasks (+1d, +3d, +7d buttons)
- ✅ Seasonal awareness (planting windows in calendar view)
- ✅ Calendar visualization of care schedules
- ✅ Shape lifecycle: `planned → establishing → established` with auto-advance

**Still Needed:**
- [ ] Guided placement suggestions on map after consultation
- [ ] Design Report/Summary (export with plant counts, guild scores)

---

### 📋 TODO: Design Report / Summary
- [ ] Printable/exportable summary of design
- [ ] Plant counts per layer
- [ ] Guild health scores for each anchor tree
- [ ] Missing guild functions across whole design
- [ ] Snapshot gallery (view/compare saved snapshots)

---

### 🔮 FUTURE: Phase 2 - Smart Site Analysis

---

### 🔮 FUTURE: Phase 2 - Smart Site Analysis
**Timeline**: +4-6 months  
**Goal**: Make recommendations truly site-specific

#### Features to Build:
- [ ] **Shade Mapping**: Calculate sun exposure by season
  - Use solar position algorithms
  - Account for existing tree heights
  - Show "full sun / part shade / full shade" zones on map
  
- [ ] **Water Flow Visualization**: 
  - Import USGS elevation data
  - Calculate slope and potential pooling areas
  - Suggest swales, berms, water-harvesting features
  
- [ ] **Existing Feature Recognition**:
  - Let users mark existing trees, structures, utilities
  - AI accounts for these in recommendations
  - Calculate shade cast by existing features
  
- [ ] **Advanced Guild Recommendations**:
  - Full polyculture suggestions (tree + shrubs + herbs together)
  - Account for allelopathy (plants that don't like each other)
  - Pest management through companion planting
  
- [ ] **Seasonal Timeline**:
  - Show plant growth over years
  - Animate maturation (year 1, 3, 5, 10)
  - Help users understand succession

---

### 🌟 FUTURE: Phase 3 - Complete Platform
**Timeline**: Full vision (12-18 months)  
**Goal**: Become the go-to food forest design tool

#### Community Features:
- [ ] Share designs publicly
- [ ] Browse designs by zone/region
- [ ] Comment and suggest improvements
- [ ] Local plant sourcing (connect to nurseries)
- [ ] Find local permaculture mentors

#### Educational Content:
- [ ] Video tutorials embedded in tasks
- [ ] Permaculture principle explanations
- [ ] Plant care guides
- [ ] Troubleshooting common problems
- [ ] Seasonal maintenance reminders

#### Advanced AI:
- [ ] Photo upload → identify existing plants
- [ ] Soil test interpretation
- [ ] Pest/disease diagnosis
- [ ] Harvest planning and recipes
- [ ] Continuous learning from user outcomes

#### Monetization:
- [ ] Freemium model (basic design free, advanced features paid)
- [ ] Affiliate links to nurseries/suppliers
- [ ] Premium AI consultations
- [ ] Printed design plans

---

## Design Principles

### User Experience
1. **One Step at a Time**: Never show users more than one task
2. **Visual Feedback**: Every action gets immediate visual response
3. **Progressive Disclosure**: Advanced features revealed as users progress
4. **Forgiveness**: Easy undo, clear, restart - no fear of mistakes
5. **Education Through Action**: Teach concepts when users need them, not before

### Visual Design
- **Color Palette**: 
  - Primary Green: `#059669` (emerald-600)
  - Dark Green: `#064e3b` (emerald-900)
  - Amber/Warning: `#f59e0b` (for boundaries, attention)
  - Neutral Grays: `#64748b`, `#334155` (slate shades)
  - White/Light: `#f8fafc` backgrounds
  
- **Typography**: 
  - System fonts (Apple/SF Pro, Segoe UI, Roboto)
  - Clear hierarchy (headers, body, labels)
  - Readable sizes (min 14px for body)
  
- **Spacing**: 
  - Generous whitespace
  - Consistent padding (0.5rem, 1rem, 1.5rem, 2rem scale)
  - Cards and panels for content grouping

### Code Quality
1. **TypeScript**: Type everything (props, state, API responses)
2. **Component Organization**: One component per file when they get big
3. **State Management**: Keep it simple - useState for now, consider Context/Zustand later
4. **Comments**: Explain "why" not "what" (code shows what)
5. **Error Handling**: Always handle API failures, missing data gracefully

---

## Data Models (Firestore Schema)

### Users Collection
```typescript
users/{userId}
  email: string
  displayName: string
  zone: string (USDA hardiness zone)
  createdAt: timestamp
  settings: {
    preferredUnits: 'metric' | 'imperial'
    notificationPreferences: object
  }
```

### Projects Collection
```typescript
projects/{projectId}
  userId: string
  name: string
  address: string
  location: { lat: number, lng: number }
  zone: string
  createdAt: timestamp
  updatedAt: timestamp
  
  boundary: {
    points: Array<{ lat: number, lng: number }>
  }
  
  layers: {
    canopy: Array<Shape>
    understory: Array<Shape>
    shrub: Array<Shape>
    // ... etc
  }
  
  siteConditions: {
    soilType: string
    drainage: string
    sunExposure: string
    goals: string[]
  }
  
  tasks: Array<Task>
  status: 'planning' | 'implementing' | 'established'
```

### Shape Type
```typescript
interface Shape {
  id: string
  type: 'circle' | 'polygon'
  center?: { lat: number, lng: number }
  radius?: number
  points?: Array<{ lat: number, lng: number }>
  plantId?: string
  notes?: string
  color: string
  createdAt: timestamp
}
```

### Task Type
```typescript
interface Task {
  id: string
  title: string
  description: string
  category: 'prep' | 'planting' | 'maintenance'
  scheduledFor: string (ISO date or "Spring Year 1")
  completed: boolean
  completedAt?: timestamp
  estimatedTime: string
  estimatedCost?: string
  educationalContent?: string
}
```

---

## AI Integration Strategy

### Claude API Usage

**When to Use Claude**:
1. **Plant Recommendations**: User finishes boundary → ask for suggestions
2. **Guild Building**: User adds a plant → suggest companions
3. **Problem Solving**: User asks questions about their design
4. **Task Generation**: User finalizes design → generate project plan
5. **Education**: User clicks "Learn More" → explain concepts

**How to Use Claude**:
- **System Prompt Template**:
```
You are a permaculture expert helping a homeowner design a food forest.
User's location: [Zone X, City, State]
Site conditions: [sun/shade, soil, size]
User's experience level: [beginner/intermediate/advanced]
User's goals: [food production, biodiversity, low maintenance, etc.]

Provide recommendations that:
- Prioritize native plants
- Follow permaculture principles (guilds, layers, succession)
- Are appropriate for the user's skill level
- Include educational context (why this plant?)
- Consider mature sizes and spacing

Format responses as JSON when requesting plant data.
Use friendly, encouraging language for conversational responses.
```

- **Structured Outputs**: Request JSON for plant lists, parse and display nicely
- **Conversational**: Allow free-form questions, maintain context
- **Cost Management**: Cache system prompts, batch requests when possible

**Example Prompts**:

*For Plant Recommendations*:
```
User has traced a 400 sq ft area in USDA Zone 8b (Austin, TX).
Soil: Clay, poor drainage. Sun: Full sun 8+ hours.
Goals: Food production, native plants, drought tolerant.

Suggest 3-5 plants for the CANOPY layer.
Return JSON:
{
  "plants": [
    {
      "commonName": "...",
      "scientificName": "...",
      "nativeStatus": "native" | "adapted" | "non-native",
      "matureHeight": "...",
      "matureWidth": "...",
      "sunNeeds": "...",
      "waterNeeds": "...",
      "whySuggested": "...",
      "companionPlants": ["...", "..."]
    }
  ]
}
```

*For Task Generation*:
```
User has designed a food forest with:
- 2 canopy trees (pecan, persimmon)
- 3 understory trees (Mexican plum, agarita)
- 5 shrub clusters (yaupon holly, turk's cap)

Current date: January 2025
Location: Austin, TX (Zone 8b)

Generate a project timeline with tasks.
Consider: soil prep time, planting windows, establishment period.
Return JSON with tasks including title, description, timing, category.
```

### Rate Limiting & Costs
- **Free tier**: ~$5/month with light usage
- **Optimize**: Cache common recommendations by zone
- **Fallback**: If API fails, show generic guidance from database
- **Monitor**: Track API calls, set budget alerts

---

## Current Challenges & Decisions Needed

### Open Questions
1. **Drawing Tool**: Canvas vs. Fabric.js vs. Leaflet.draw?
   - *Leaning toward*: Fabric.js (good balance of control and ease)
   
2. **Plant Database**: Build our own vs. use existing API?
   - *Leaning toward*: Start with curated JSON files, expand to DB later
   
3. **Zone Detection**: Auto-detect from address or ask user?
   - *Leaning toward*: Auto-detect with option to override
   
4. **Mobile Support**: Responsive design or dedicated mobile app later?
   - *Decision*: Responsive design first, mobile app if traction
   
5. **Data Persistence**: How often to auto-save?
   - *Decision*: Save on every major action (finish boundary, add shape)

### Known Technical Debt
- Google Maps API key is exposed in frontend (need backend proxy eventually)
- No user authentication yet (needed before multi-project support)
- Hardcoded plant layer names (should be configurable)
- No error boundaries (app crashes ungracefully on errors)

---

## AI Collaboration Rules of Engagement

### What I Need from AI Assistants

**DO:**
1. ✅ **Explain your reasoning** before coding
2. ✅ **Ask clarifying questions** if requirements are ambiguous
3. ✅ **Suggest better approaches** if you see a flaw in my plan
4. ✅ **Keep code simple** - I'm not a professional developer
5. ✅ **Add comments** explaining non-obvious logic
6. ✅ **Use TypeScript** properly (type everything)
7. ✅ **Test edge cases** mentally and point them out
8. ✅ **Show me alternative approaches** with pros/cons
9. ✅ **Teach me** along the way (I want to learn)
10. ✅ **Flag technical debt** when we're taking shortcuts

**DON'T:**
1. ❌ **Overwhelm with options** - give me 1-2 good choices, not 10
2. ❌ **Use overly complex patterns** - no unnecessary abstractions
3. ❌ **Change file structure** without asking
4. ❌ **Introduce new dependencies** without explaining why
5. ❌ **Assume I know jargon** - explain technical terms
6. ❌ **Give me huge code blocks** - break into steps
7. ❌ **Skip error handling** - always account for failures
8. ❌ **Ignore accessibility** - basic a11y is important
9. ❌ **Break existing features** when adding new ones
10. ❌ **Leave console.logs** or debug code in production

### How to Give Feedback
- **If something breaks**: "The X feature stopped working after that change"
- **If UX is confusing**: "When I try to Y, it's unclear that I should Z"
- **If code is hard to understand**: "Can you explain what's happening in the X function?"
- **If you want a different approach**: "This works, but feels clunky. Is there a cleaner way?"

### Debugging Protocol
1. **Describe what's wrong**: Expected vs. actual behavior
2. **Show the error**: Console errors, screenshots if relevant
3. **AI provides hypothesis**: "This is likely because..."
4. **AI suggests fix**: Specific code changes with explanation
5. **Test and confirm**: I'll report if it worked
6. **Document**: Add the fix to this guide if it's a common issue

### Code Review Checklist
Before marking any feature "done", AI should verify:
- [ ] Does it work in the happy path?
- [ ] What happens if user does something unexpected?
- [ ] Are there any console errors?
- [ ] Is it mobile-responsive (if applicable)?
- [ ] Are loading states handled?
- [ ] Are error states handled?
- [ ] Is the code commented where needed?
- [ ] Did we introduce any obvious performance issues?

---

## Development Workflow

### Session Startup Template
When starting a new AI session, I'll paste:

```
I'm working on Little Food Forests (see PROJECT_ROADMAP.md).

Current Status: [Phase X, Milestone Y]
Last Working: [Brief description of what was just completed]
Next Goal: [What I want to accomplish this session]

Relevant Files: [List any files that will be modified]

Let me know if you need any clarification before we start!
```

### When Switching AI Assistants
If I move from Claude to another AI (or start fresh):

1. Share this `PROJECT_ROADMAP.md` file
2. Share current `App.tsx` and relevant component files
3. Describe current state: "I've completed X, now working on Y"
4. Ask: "Do you understand the project? Any questions before we continue?"

### Git Commit Strategy
After each working feature:
```
feat: [brief description]

- What changed
- Why it changed
- Any notes for future me
```

Example:
```
feat: add boundary tracing with visual markers

- Users click corners to trace property
- Visual markers show each point
- Lines connect points as they draw
- First point labeled "1" and highlighted
- Must have 3+ points to complete

Next: Build custom canvas drawing layer
```

---

## Success Metrics (How We Know It's Working)

### Phase 1 MVP Success Criteria
- [ ] 10 users complete full flow (welcome → design → plan)
- [ ] Average session time: 15-30 minutes
- [ ] At least 5 users return to check their plan
- [ ] User feedback: "This was easy to use"
- [ ] No critical bugs in core flow

### Long-term Success Metrics
- Users actually implement their designs (photo uploads, progress updates)
- Users report successful harvests
- Users recommend the tool to others
- Native plant adoption increases in user yards
- Reduction in chemical inputs (fertilizers, pesticides) reported

---

## Resources & References

### Permaculture Knowledge
- **Plant Guilds**: Research classic examples (Three Sisters, Apple Guild)
- **Forest Layers**: Canopy, Sub-canopy, Understory, Shrub, Herbaceous, Groundcover, Rhizosphere, Vertical (vines)
- **Zone Planning**: Permaculture zones 0-5 (most → least maintained)
- **Patterns**: Mandala gardens, keyhole beds, swales, hugelkultur

### Data Sources
- **USDA PLANTS Database**: https://plants.usda.gov/
- **USDA Hardiness Zones**: https://planthardiness.ars.usda.gov/
- **Native Plant Lists**: State-specific native plant societies
- **Elevation Data**: USGS National Map

### Technical References
- **Google Maps API Docs**: Drawing tools, geocoding
- **Fabric.js Docs**: Canvas manipulation
- **Claude API Docs**: Anthropic developer docs
- **Firestore Docs**: Data modeling best practices

### Inspiration
- Apps to study: SketchUp (3D design UX), Figma (collaborative canvas), Duolingo (progressive learning)
- Similar tools: iScape (landscape design), Garden Planner, SmartDraw

---

## Contact & Project Info

**Developer**: [Your Name]  
**Project Start**: January 2025  
**Current Phase**: Phase 1 - MVP  
**Primary AI Assistant**: Claude (Anthropic)  
**Repository**: [Link when you create it]  
**Live Demo**: [Link when deployed]

---

## Changelog

### 2025-01-17
- ✅ Created project structure (Vite + React + TypeScript)
- ✅ Built welcome screen with value proposition
- ✅ Implemented address search with geocoding
- ✅ Created boundary tracing with visual markers and feedback
- ✅ Added step-by-step wizard flow
- ✅ Created this comprehensive roadmap document

### 2025 (ongoing sessions)
- ✅ Replaced Google Maps with React-Leaflet
- ✅ Built full drawing interface (circle, line, polygon tools)
- ✅ 8-layer food forest system with color coding
- ✅ Select/move/resize with center handles on all shapes
- ✅ Water & Topography tab with place/select/move/delete
- ✅ Plant database (Firestore) with search, filters, guild functions
- ✅ Plant assignment to shapes with active brush
- ✅ Guild analysis panel (spatial, 2x canopy radius scan)
- ✅ Multiple map tile styles (Light, Dark, Street, Satellite)
- ✅ Zoom slider + step buttons
- ✅ Wiki platform with admin panel
- ✅ Firebase Auth + Firestore auto-save
- ✅ Hover tooltips on shape center handles
- ✅ Groundcover species selector

### May 2026 (Latest)
- ✅ PlantingTask system — one-time setup tasks (Preparation → Planting Day → First 30 Days → Year One)
- ✅ CareItem system — recurring maintenance tasks with intervals, XP tracking, completion history
- ✅ Shape lifecycle — `planned → establishing → established` with auto-advance on task completion
- ✅ Calendar view — visualize care due dates and planting windows by month
- ✅ Task completion UI — expandable cards with badges (overdue/today/upcoming)
- ✅ Reschedule/snooze — push care items forward (+1d, +3d, +7d)
- ✅ userId isolation — all documents include userId, Firestore security rules enforce per-user access
- ✅ Consultation history persistence — save and restore Claude conversations
- ✅ PlanningScreen redesign — Tasks tab vs. Calendar tab, combined task list
- ✅ Removed debug console.log from taskGenerator
- ✅ Created firestore.rules file with security rules
- ✅ Created firebase.json for deployment
- ⚠️ BREAKING: Old documents (projects, tasks, careItems) now require userId field to be accessible

### Next Session Goals (Phase 1 Completion)
- [ ] Design Report/Summary view (plant counts, guild health, missing functions)
- [ ] Snapshot Gallery (save/compare multiple snapshots over time)
- [ ] Deploy Firestore security rules (`firebase deploy --only firestore:rules`)
- [ ] Migrate old Firestore documents to include userId field
- [ ] Guided placement suggestions on map after consultation

---

*Last Updated: 2026-05-14*
*Version: 2.1*

---

## Quick Reference: Current Tech Stack

```
Frontend:
├── React 18 + TypeScript
├── Vite (build tool)
├── Google Maps API (@react-google-maps/api)
└── Custom CSS (no framework)

Backend (Future):
├── Firestore (NoSQL database)
├── Firebase Auth (user management)
└── Cloud Functions (serverless API)

AI:
└── Claude API (Anthropic)

Hosting (Future):
├── Vercel (frontend)
└── Firebase (backend)
```

## Quick Reference: File Structure

```
little-food-forests/
├── src/
│   ├── App.tsx          (Main component - wizard flow)
│   ├── App.css          (All styles currently here)
│   ├── main.tsx         (Entry point)
│   └── vite-env.d.ts    (TypeScript definitions)
├── public/              (Static assets)
├── .env                 (Google Maps API key - not in git)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── PROJECT_ROADMAP.md   (This file!)
```

---

**Ready to build something amazing! 🌱**