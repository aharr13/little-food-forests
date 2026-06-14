# Little Food Forests - AI Collaboration Guide
cd /mnt/c/Users/aharr/Desktop/little-food-forests

## Project Context (Quick Brief)

**What we're building**: Web app that helps people design regenerative food forests in their yards with step-by-step guidance and AI-powered plant recommendations.

**Current phase**: Phase 1 MVP - Building custom drawing tools for placing plants on a map.

**Tech stack**: React + TypeScript, Google Maps API, Firestore, Claude API

**My level**: Not a professional programmer - explain things clearly, keep it simple.

---

## How to Work With Me

### 🎯 Core Principles

**DISCUSS BEFORE CODING**
- When I describe what I want, **ask clarifying questions first**
- Propose your approach and explain the tradeoffs
- Wait for my "go ahead" before writing lots of code
- If you see a better way, suggest it and explain why

**KEEP IT SIMPLE**
- I'm learning - explain technical concepts in plain language
- Avoid unnecessary abstractions or complex patterns
- One feature at a time, fully working before moving on
- Small, understandable code blocks (not giant walls of code)

**TEACH AS WE GO**
- Explain *why* you're doing something, not just *what*
- Point out best practices and common pitfalls
- Help me understand the decisions we're making
- Flag when we're taking shortcuts (technical debt)

---

## Session Workflow

### 1️⃣ START: Context Setting (You paste this)

```
Working on: Little Food Forests
Current Status: [What's working now]
Today's Goal: [What I want to accomplish]
Files involved: [List any specific files]

[Paste previous session's END LOG if available]
```

### 2️⃣ MIDDLE: Development Process

**When I request a feature:**

1. **AI asks questions**:
   - "Just to clarify, do you want X or Y?"
   - "Should this happen before or after Z?"
   - "What should happen if the user does [edge case]?"

2. **AI proposes approach**:
   - "Here's how I'd build this..."
   - "We have two options: [A] simple but limited, [B] complex but flexible"
   - "This will require changing [these files]"

3. **I give feedback/approval**:
   - "Yes, go with option A"
   - "Wait, I actually want it to work like..."
   - "That makes sense, let's do it"

4. **AI implements**:
   - Break into small steps if it's big
   - Explain each significant change
   - Test edge cases mentally

5. **We test & iterate**:
   - I report what works/breaks
   - We debug together
   - Refine until it's solid

### 3️⃣ END: Session Summary (AI generates this)

At the end of each session, AI creates a log following this template:

```markdown
# Session Log - [Date]

## What We Built
- [Feature 1]: Brief description of what it does
- [Feature 2]: Brief description of what it does

## Changes Made
- Modified: [filename] - [what changed and why]
- Created: [filename] - [what it does]
- Fixed: [what was broken and how we fixed it]

## How It Works (Teaching Section)
[Explain 1-2 key concepts or patterns we used]

Example:
"We used React state to track boundary points. Each time the user clicks,
we add a new point to the array, and React re-renders the markers. This is
called 'lifting state up' - the parent component holds the data."

## Challenges Solved
- [Problem we ran into and how we solved it]

## What's Next
- [ ] [Next logical feature to build]
- [ ] [Known issue to fix]

## Technical Debt / Notes
- [Anything we're doing quick-and-dirty that should be cleaned up later]
- [Gotchas or things to remember]

## Code Snippets to Remember
[Any particularly useful patterns or snippets worth saving]

```typescript
// Example: How we handle map clicks
const handleMapClick = (e: google.maps.MapMouseEvent) => {
  if (!isDrawing || !e.latLng) return;
  const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
  setPoints([...points, newPoint]);
};
```
```

---

## What I Need From You

### ✅ DO:

1. **Ask before coding** - Especially for big features
2. **Explain your reasoning** - Why this approach?
3. **Keep code simple** - I need to understand it
4. **Comment non-obvious code** - Future me will thank you
5. **Handle errors gracefully** - What if the API fails?
6. **Think about edge cases** - What if user does something weird?
7. **Suggest improvements** - If you see a better way, tell me
8. **Use TypeScript properly** - Type everything
9. **Break big tasks into steps** - Don't overwhelm me
10. **Teach me patterns** - Help me learn as we build

### ❌ DON'T:

1. **Don't dump huge code blocks** - Break it down
2. **Don't use complex patterns** - Unless really needed
3. **Don't assume I know jargon** - Explain terms
4. **Don't change file structure** - Without asking first
5. **Don't add dependencies** - Without explaining why
6. **Don't skip error handling** - Always account for failures
7. **Don't ignore my questions** - Even if they seem basic
8. **Don't leave debug code** - Clean up console.logs
9. **Don't break existing features** - Test before and after
10. **Don't forget accessibility** - Basic a11y matters

---

## Communication Examples

### ❌ Not Helpful:
**Me**: "I want users to draw circles for trees"  
**AI**: [Dumps 200 lines of code]

### ✅ Helpful:
**Me**: "I want users to draw circles for trees"  
**AI**: "Got it! A few questions:
- Should they click-and-drag to size the circle, or click once for a fixed size?
- Do circles need to be editable after drawing (resize, move, delete)?
- Should different tree types have different colors?
- Do we need to store these in Firestore right away, or just keep in state for now?

I'm thinking we use an HTML canvas overlay on the map. Want me to explain that approach first?"

---

### ❌ Not Helpful:
**Me**: "The map isn't loading"  
**AI**: "Try checking your API key"

### ✅ Helpful:
**AI**: "Let's debug this step by step:
1. Check the browser console for errors - what do you see?
2. Is the API key definitely in your .env file as VITE_GOOGLE_MAPS_API_KEY?
3. Did you restart the dev server after adding the key?

Most likely it's [X] because [Y]. Let me know what the console says and we'll narrow it down."

---

## Project Files Quick Reference

**Main Files** (you'll mostly work with these):
- `src/App.tsx` - Main app component, wizard flow
- `src/App.css` - All styling (for now)
- `.env` - Environment variables (API keys)

**Don't Touch** (unless we discuss):
- `package.json` - Dependencies
- `vite.config.ts` - Build configuration  
- `tsconfig.json` - TypeScript settings

---

## Current State Snapshot

### ✅ What Works:
- Welcome screen
- Address search with geocoding
- Boundary tracing (click corners, visual markers)
- Step-by-step wizard flow

### 🔨 In Progress:
- Custom canvas drawing layer for plants

### 📋 Next Up:
- Layer selector (Canopy, Understory, Shrub, etc.)
- Save designs to Firestore
- AI plant recommendations

### 🐛 Known Issues:
- None currently (we fixed the marker label blocking clicks!)

---

## When Things Break

### Debugging Protocol:

1. **I describe the problem**:
   - What I expected to happen
   - What actually happened
   - Any error messages

2. **You ask diagnostic questions**:
   - "What do you see in the console?"
   - "Does it happen every time or randomly?"
   - "Did you change anything before it broke?"

3. **You provide hypothesis + fix**:
   - "This is likely happening because..."
   - "Here's how we can fix it..."
   - "Let's try changing [this line]..."

4. **We test and verify**:
   - I test the fix
   - Report back if it worked
   - Iterate if needed

---

## Code Review Checklist

Before saying "done", verify:

- [ ] Does it work in the happy path?
- [ ] What if user does something unexpected?
- [ ] Are there console errors?
- [ ] Is it mobile-responsive (basic check)?
- [ ] Are loading states handled?
- [ ] Are error states handled?
- [ ] Is the code commented where needed?
- [ ] No obvious performance issues?

---

## Success = Simple + Working + Understandable

**Remember**: 
- I'd rather have simple code that works than clever code I don't understand
- It's better to ship something basic and iterate than perfect something forever
- I'm learning - help me build mental models, not just copy-paste solutions

---

*Last Updated: 2025-01-17*

---

## Example Session End Log

```markdown
# Session Log - 2025-01-17

## What We Built
- Boundary tracing feature: Users can click corners to outline their property
- Visual feedback: Markers and lines appear as users draw
- Validation: Must have 3+ corners to finish boundary

## Changes Made
- Modified: `App.tsx` - Added boundary tracing logic with click handlers
- Modified: `App.tsx` - Added visual markers with Google Maps Marker component
- Modified: `App.css` - Added styles for drawing controls and buttons
- Fixed: Marker label changed from "START" to "1" to prevent blocking clicks

## How It Works (Teaching Section)

**React State for Dynamic UI**:
We're using `useState` to store boundary points. Every time the user clicks:
1. We add a new point to the array: `setPoints([...points, newPoint])`
2. React automatically re-renders the markers
3. The `map()` function creates a marker for each point

This is React's core pattern: state changes → UI updates automatically.

**Google Maps Coordinate System**:
Each point is stored as `{lat: number, lng: number}`. When we click the map,
Google gives us the coordinates, we store them, then draw markers/lines at
those exact spots. The map handles all the projection math for us.

## Challenges Solved
- **Marker labels blocking clicks**: Originally used "START" text label which 
  prevented users from clicking the first point to close the polygon. Changed 
  to "1" inside the circle which doesn't block the clickable area.
  
- **Unclear instructions**: Added dynamic instructions that change based on 
  state (before drawing, first click, subsequent clicks).

## What's Next
- [ ] Build custom canvas overlay for drawing plant circles
- [ ] Add layer selector (Canopy, Understory, Shrub, etc.)
- [ ] Implement click-and-drag circle drawing
- [ ] Save boundary data to Firestore

## Technical Debt / Notes
- Google Maps API key is in frontend code (need backend proxy later for security)
- All code is in one App.tsx file (should split into components eventually)
- No user authentication yet (needed before we add save functionality)

## Code Snippets to Remember

```typescript
// How to handle map clicks and build an array of points
const handleMapClick = (e: google.maps.MapMouseEvent) => {
  if (!isDrawingBoundary || !e.latLng) return;
  
  const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
  setBoundaryPoints([...boundaryPoints, newPoint]);
};

// How to create custom Google Maps markers
<Marker
  position={point}
  icon={{
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 6,
    fillColor: '#f59e0b',
    fillOpacity: 1,
    strokeColor: 'white',
    strokeWeight: 2,
  }}
/>
```
```

**End of example log.**

---

**That's it! Simple, focused, practical.** 🚀

Session Log - January 17, 2026- January 27, 2026
Session 2: Bug Fixes & Testing Prep (3:00 PM - 4:30 PM)
Issues Resolved:

Fixed import paths in Canvas components ('../../types' → './types')
Clarified Firebase Auth flow (email → userId mapping stored in Authentication, not Firestore)
Identified missing Firestore composite index causing Dashboard to not load projects

Next Steps:
Create Firestore index (projects collection: userId Ascending + updatedAt Descending), then test complete drawing flow including wizard, all 8 layers, three shape tools, visibility controls, and save/load functionality. Document any bugs or UX issues found.