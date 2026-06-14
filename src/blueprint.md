# Little Food Forests - Mission, Vision & Feature Roadmap
cd /mnt/c/Users/aharr/Desktop/little-food-forests

## Mission Statement

**Little Food Forests empowers everyday people to transform their yards and communities into thriving regenerative food ecosystems through accessible technology, education, and collaboration.**

We believe that growing food should be:
- **Accessible** to everyone, regardless of gardening experience
- **Regenerative** - improving soil, biodiversity, and climate resilience
- **Educational** - teaching permaculture principles through hands-on practice
- **Community-driven** - sharing knowledge and success stories
- **Free** - supported by grants and donations, never paywalled

---

## Vision

### Short-term (2025)
Launch in Austin, Texas as a free web tool that helps beginners design and implement native food forests in their yards. Prove the concept works by collecting success stories and creating a foundation for grant funding.

### Medium-term (2026-2027)
Expand to schools, community groups, and public parks throughout Texas. Build a database of what works based on real user outcomes. Partner with native plant nurseries to make implementation easier.

### Long-term (2028+)
Become the national standard for regenerative food forest design. Demonstrate measurable impact on urban biodiversity, soil health, food security, and climate resilience. Inspire a movement of backyard and community food forests across America.

---

## Core Values

1. **Education First**: Every feature teaches permaculture principles
2. **Data-Driven**: Learn from real outcomes to improve recommendations
3. **Beginner-Friendly**: Low skill and time investment required
4. **Native Plants**: Prioritize local ecosystems and biodiversity
5. **Open Access**: Free forever, sustained by community and grants

---

## Feature Roadmap

### 🎯 PHASE 1: PROOF OF CONCEPT (Jan - March 2025)
**Goal**: Create a working demo to show schools, cities, and grant organizations

---

#### 1.1 Site Mapping & Design Tools

**Boundary Tracing** ✅ COMPLETE
- Users enter their address and find their property on satellite view
- Click corners to trace property boundary
- Visual markers and connecting lines show progress
- Validation ensures minimum 3 corners before proceeding

**Why it matters**: Accurate property boundaries are the foundation for everything else. Satellite view helps users see their existing landscape (trees, structures, slopes).

---

**Custom Canvas Drawing** ✅ COMPLETE
- Overlay drawing canvas on satellite map
- Click-and-drag to draw circles representing plants
- Each circle represents tree canopy spread or plant cluster
- Pan and zoom while drawing
- Undo/redo functionality
- Color-coded by layer type

**Why it matters**: Users need an intuitive way to "place" plants visually. Circles are easier than complex polygons and naturally represent how trees grow (radial canopies).

**How it works**: HTML5 Canvas overlays the Google Map. User clicks set center point, dragging sets radius. Canvas coordinates convert to lat/lng for storage.

---

**Layer Selector**
- Organize plants by food forest layers:
  - **Canopy**: Tall trees (20-40ft+) - Provides shade, structure, large fruits/nuts
  - **Understory**: Small trees (10-20ft) - Shade-tolerant fruits, nitrogen fixers
  - **Shrub**: Woody bushes (3-10ft) - Berries, habitat, erosion control
  - **Herbaceous**: Perennial herbs/vegetables - Food, medicine, pest management
  - **Groundcover**: Low spreading plants - Living mulch, weed suppression
  - **Rhizosphere**: Root crops - Soil building, nutrient mining
  - **Vine**: Vertical climbers - Space-efficient food production
- Each layer has distinct color for visual organization
- Toggle layers on/off to reduce visual clutter
- Users select layer before drawing

**Why it matters**: Food forests mimic natural forest structure with multiple productive layers. Organizing by layer helps users understand spatial relationships and ensures they don't just plant random trees.

**How it works**: Each drawn shape stores its layer type. Filters and colors apply based on layer. AI recommendations later use layer info to suggest compatible plants.

---

**Water & Topography Mapping** ✅ COMPLETE
- Users click to mark:
  - Highest point on property
  - Lowest point on property
  - Areas where water pools after rain
- Visual indicators show these features on map
- AI uses this data to:
  - Suggest swales (water-catching trenches) along contour lines
  - Recommend berms (raised planting beds) for drainage
  - Place water-loving plants in low spots
  - Place drought-tolerant plants on high/dry areas

**Why it matters**: Water is the most critical resource. Capturing and storing rainwater on-site reduces irrigation needs and prevents erosion. Most beginners don't understand water flow patterns.

**How it works**: Users provide 3-5 simple data points. Basic slope calculation shows water flow direction. AI suggests earthworks and plants based on wet/dry zones.

---

#### 1.2 User Accounts & Data Persistence

**Firebase Authentication**
- Email/password sign up and login
- Password reset via email
- Built to easily add Google/Apple sign-in later
- Session management (stay logged in)
- Secure token-based authentication

**Why it matters**: Users need to save their work between sessions. Authentication also enables personalization and progress tracking later.

**How it works**: Firebase handles all auth complexity. We just integrate their SDK. Tokens stored in browser, validated server-side.

---

**Firestore Database**
- Each user has a unique ID
- Projects collection stores designs:
  - Property boundary coordinates
  - All drawn shapes (plants) with layer info
  - Site conditions (water, topography)
  - User notes and preferences
- Auto-save on major actions
- Manual save button for peace of mind
- Load previous designs from dashboard

**Why it matters**: NoSQL database scales well and syncs in real-time. Free tier covers thousands of users. Easy to query and structure data.

**How it works**: Each project is a document with nested data. Firestore syncs automatically when online, works offline too.

---

**User Profile**
- Minimal for Phase 1:
  - Email (from auth)
  - Optional display name
  - USDA hardiness zone (auto-detected from address, can override)
- Future additions:
  - Experience level (beginner/intermediate/advanced)
  - Garden goals (food, habitat, beauty, education)
  - Favorite plants
  - Profile photo

**Why it matters**: Zone is critical for plant recommendations. Other data helps personalize the experience.

**How it works**: Simple form, data stored in Firestore users collection.

---

#### 1.3 Education & Learning

**Wiki Article Library** ✅ COMPLETE
- In-app encyclopedia of permaculture concepts
- Articles organized by topic:
  - **Getting Started**: What is a food forest? Why permaculture?
  - **Design Principles**: Layers, guilds, succession, zones
  - **Plant Science**: Nitrogen fixers, dynamic accumulators, companion planting
  - **Techniques**: Sheet mulching, chop-and-drop, swales and berms
  - **Maintenance**: Seasonal care, pest management, harvesting
- Search and browse functionality
- Links between related articles
- Embedded in workflow (contextual help)

**Why it matters**: Users can't design well without understanding concepts. Just-in-time learning is more effective than front-loading information.

**How it works**: Markdown files stored in database or static JSON. Rendered as formatted articles. Search uses simple text matching at first.

---

**Contextual Learning Prompts**
- Pop-up explanations at decision points
- Examples:
  - When selecting "Canopy" layer: "Canopy trees provide shade and structure. Choose 1-3 large trees spaced 15-30ft apart."
  - When drawing first circle: "This represents the mature canopy spread. Most fruit trees need 15-20ft diameter."
  - When AI suggests nitrogen fixers: "Nitrogen fixers (like legumes) pull nitrogen from air into soil, feeding nearby plants!"
- "Learn more" links to full wiki articles
- Can be dismissed (don't interrupt advanced users)

**Why it matters**: Education embedded in the workflow prevents overwhelm. Users learn by doing.

**How it works**: Tooltips and modals triggered by actions. Content stored in simple config file, easy to update.

---

**Plant Profiles**
- Detailed info for each recommended plant:
  - Common name, scientific name, photos
  - Native status (native, adapted, non-native)
  - Mature size (height and spread)
  - Sun requirements (full sun, part shade, full shade)
  - Water needs (xeric, moderate, riparian)
  - Soil preferences (clay, loam, sand, pH)
  - Growth rate (slow, moderate, fast)
  - Edible parts and harvest timing
  - Wildlife value (pollinators, birds, butterflies)
  - Companion plants (guild members)
  - Special notes (thorny, poisonous if consumed, allelopathic)

**Why it matters**: Users need to know what they're planting. Photos help with identification. Care requirements prevent mistakes.

**How it works**: Database of Austin-area plants with structured data. Claude can reference this when making recommendations.

---

#### 1.4 AI-Powered Plant Recommendations

**Curated Plant Guilds**
- We hand-select 8-10 proven plant combinations for Central Texas
- Examples:
  - **Oak Savanna Guild**: Live oak + Texas persimmon + agarita + turk's cap + frog fruit
  - **Shade Garden Guild**: Mexican plum + coralberry + inland sea oats + wood ferns
  - **Full Sun Food Production**: Pecan + Mexican plum + Texas mulberry + blackberries + sweet potato vine
  - **Xeric (Drought) Guild**: Cedar elm + Texas redbud + yaupon holly + four-nerve daisy
  - **Riparian (Wet) Guild**: Bald cypress + possumhaw holly + switchgrass + cardinal flower
- Each guild includes:
  - Canopy + understory + shrub + herbaceous + groundcover
  - Plants that support each other ecologically
  - Clear spacing guidelines
  - Planting sequence (what goes in first)

**Why it matters**: Guilds are tested combinations that work. Beginners need proven recipes, not infinite customization. Austin-specific ensures climate appropriateness.

**How it works**: Guilds stored as JSON. Claude API receives site conditions, picks best guild, explains why.

---

**Claude AI Integration**
- User provides site conditions:
  - Property size
  - Sun exposure (full sun, partial, full shade)
  - Soil drainage (poor, moderate, excellent)
  - Water availability (rainfed only, supplemental irrigation available)
  - Goals (food production, wildlife habitat, low maintenance, beauty)
- Claude analyzes conditions
- Selects most appropriate guild
- Customizes recommendations:
  - Adjusts plant spacing for property size
  - Suggests substitutions if user has preferences
  - Explains ecological relationships
  - Warns about potential challenges
- Conversational follow-up:
  - User can ask "Why this tree?"
  - User can say "I don't like pecans"
  - Claude adapts recommendations

**Why it matters**: AI makes expert knowledge accessible. Instead of users researching for weeks, they get personalized guidance in minutes.

**How it works**: 
1. Collect site data via form
2. Send to Claude API with system prompt (context about Austin, permaculture principles)
3. Claude returns JSON with plant recommendations
4. We parse and display beautifully
5. Allow conversational refinement

**Cost management**: Cache system prompts, batch requests. Expect <$0.10 per design.

---

#### 1.5 Project Planning & Progress Tracking

**Planting Tasks (One-Time Setup)**
- For each planted shape, Claude generates step-by-step planting instructions
- Tasks organized by phase:
  - **Preparation**: Site prep, soil work, digging
  - **Planting Day**: Actual planting and mulching
  - **First 30 Days**: Intensive watering and monitoring
  - **Year One**: Continued establishment care
- Each step includes: title, detailed instructions, tips, estimated time
- Users check off steps as completed
- XP reward increments proportionally (10% XP per step done)
- When all steps completed → shape auto-advances to "establishing"

**Care Items (Recurring Maintenance)** ✨ *Added beyond Phase 1 plan*
- Once a plant enters "establishing" phase, recurring care tasks auto-generate
- Tasks repeat every N days (watering every 3 days, pruning every 30 days, etc.)
- Recurring per plant based on species and growth phase
- User can complete task (resets next due date to today + interval)
- Or reschedule for +1, +3, +7 days if can't do today
- XP earned on each completion
- Tracks completion history and total XP earned

**Shape Lifecycle** ✨ *Added beyond Phase 1 plan*
- **Planned**: User places shape on map, needs planting tasks
- **Establishing**: All planting steps done → auto-advances, care items unlock
- **Established**: User manually marks when plant is self-sufficient

This multi-phase system reflects the reality: **establishing a food forest takes 6-24 months of active care, not just planting.**

**Calendar View** ✨ *Added beyond Phase 1 plan*
- Visual calendar showing all care items due in each month
- Due dates highlighted by plant layer color
- Planting window banner shows which plants can be planted this month (respects year wrap)
- Legend shows which layers have scheduled care
- Helps users plan ahead and avoid task pile-up

**Progress Tracking Interface**
- Task checklist with expandable cards
- Each card shows plant name, task title, due date badge (overdue/today/upcoming)
- Tabs: "Tasks" view vs. "Calendar" view
- Stats dashboard: total XP, planting steps complete %, care tasks today
- Supports both one-time tasks and recurring maintenance in single view

**Gamification (Basic)**
- XP earned on each task completion
- Points scale by difficulty and task type
- Progress bars for both planting phases and maintenance
- No competitive leaderboards — purely personal progression

---

---

### 🎯 PHASE 1 SCOPE EXPANSION (Implementation Reality)

**What Changed from Original Plan:**
The original Phase 1 vision was a "simple checklist" of planting tasks. During implementation, it became clear that **food forests require 6-24 months of active maintenance**, not just a one-time planting. The scope expanded to include:

- **Care Items system** — Recurring tasks per plant (watering, pruning, fertilizing) with customizable intervals
- **Shape lifecycle** — `planned → establishing → established` workflow that auto-advances when planting is done
- **Calendar view** — Visualize care schedules month-by-month with planting windows
- **Reschedule/snooze** — Users can push tasks forward instead of marking incomplete
- **User data isolation** — Firestore security rules enforce per-user access (required for multi-user platform)
- **Consultation history** — Persist Claude conversations so users can resume where they left off

**Why:** The original scope treated food forests like a one-time planting project. Reality is messier: beginners need ongoing guidance through the establishment phase. This expanded Phase 1 is a more honest reflection of what users actually need.

**Outcome:** Phase 1 MVP now includes design + implementation planning + maintenance guidance through year one.

---
**Goal**: Learn what works, build community, establish partnerships

---

#### 2.1 Outcome Tracking

**Plant Success Tracking**
- For each plant in their design, users can report:
  - Survival (alive, struggling, dead)
  - Growth rate (slower/faster than expected)
  - Pest/disease issues
  - First harvest date (for food plants)
  - Harvest quantity (low, moderate, abundant)
- Simple emoji-based interface for quick updates
- Optional detailed notes
- Photos of healthy/struggling plants

**Why it matters**: This is the SECRET WEAPON. No other tool collects this data. We'll know which plants actually thrive in Austin yards, not just theory.

**How it works**: Periodic prompts ("How's your persimmon tree doing?"). Data aggregated across all users to improve recommendations.

---

**Combination Success Analysis**
- Which plant combinations work well together
- Which combinations fail (allelopathy, competition)
- Soil improvement from specific guilds
- Water usage reduction

**Why it matters**: Some guilds look good on paper but fail in practice. Real data makes recommendations exponentially better.

**How it works**: Backend analyzes: "Users who planted X + Y together had 85% success vs. 60% when alone." Feed this into AI recommendations.

---

**Common Mistakes Database**
- Track what goes wrong:
  - Planting too close (overcrowding)
  - Wrong season planting
  - Insufficient watering during establishment
  - Poor soil prep
- AI warns users about common mistakes before they make them

**Why it matters**: Learn from others' failures. Prevent repeat mistakes.

**How it works**: Users report issues, we categorize. AI system prompt includes "Common mistakes to warn about."

---

#### 2.2 Nursery Partnerships

**Shopping List Generator**
- After finalizing design, generate printable plant list:
  - Quantity of each plant
  - Preferred size (seeds, 1-gallon pot, 5-gallon pot, bare root)
  - Best planting time
  - Total estimated cost
- Can email list to local nurseries
- Can download as PDF

**Why it matters**: Reduces friction between design and implementation. Users know exactly what to buy.

**How it works**: Parse final design, count plants, format as clean list.

---

**Partner Nursery Directory**
- List of Austin-area native plant nurseries
- Filter by:
  - Location (closest to user)
  - Specialties (native plants, fruit trees, seeds)
  - Availability (what's in stock seasonally)
- Contact info and links

**Why it matters**: Many users don't know where to buy native plants. Connecting them to good nurseries helps everyone.

**How it works**: Curated list of verified nurseries. Eventually: API integration for inventory, affiliate links for sustainability.

---

**Future: Affiliate Revenue**
- Partner nurseries give us referral fee (5-10%)
- Revenue sustains free app
- Transparent to users ("Supporting local nurseries supports Little Food Forests")

**Why it matters**: Grants are competitive. Affiliate revenue is predictable, aligns incentives (we succeed when nurseries succeed).

**How it works**: Unique referral codes or links. Nurseries track sales, pay monthly.

---

#### 2.3 Community Features

**Public Design Gallery**
- Users can choose to make designs public
- Browse designs by:
  - Property size
  - Sun exposure
  - Goals (food, habitat, etc.)
  - Neighborhood (for hyper-local inspiration)
- Like and comment on designs
- Clone a design as starting point

**Why it matters**: See what neighbors are doing. Steal good ideas. Feel part of a movement.

**How it works**: Privacy toggle on each project. Public designs indexed and searchable. Comments stored as subcollection.

---

**Progress Photo Feeds**
- Share implementation photos
- Before/after comparisons
- Seasonal updates
- Harvest photos
- Build community motivation

**Why it matters**: Photos inspire action. Seeing real results from real people is more powerful than theory.

**How it works**: Image uploads to Firebase Storage. Photos associated with projects. Feed view shows recent uploads from community.

---

**Local Groups**
- Neighborhood-based groups
- Group forums for questions
- Shared resources (tool libraries, bulk buying)
- Organize planting days

**Why it matters**: Doing this alone is hard. Local community provides support, accountability, shared knowledge.

**How it works**: Groups created by zip code or manual assignment. Simple forum software or integration with Discord/Facebook.

---

#### 2.4 School & City Programs

**Curriculum Materials**
- Lesson plans for K-12 teachers
- Aligned with Texas education standards (science, ecology, math)
- Student worksheets
- Assessment rubrics
- Teacher training videos

**Why it matters**: Schools need structured curriculum. Food forests teach ecology, biology, math (spacing, growth rates), responsibility.

**How it works**: Collaborate with educators. Pilot with 2-3 schools. Iterate based on feedback.

---

**Park/Community Garden Mode**
- Design features for public spaces:
  - Accessibility considerations
  - Maintenance plans for volunteer groups
  - Signage recommendations (educational plant labels)
  - Community event ideas (harvest festivals, planting days)
- Proposal templates for approaching city parks departments

**Why it matters**: Public food forests have huge impact but need different design considerations. Also: great grant opportunities.

**How it works**: Toggle "Public space" mode. Adjusts recommendations (avoid thorny plants near paths, add benches/gathering spaces, etc.)

---

### 🌟 PHASE 3: SCALE & IMPACT (2026+)
**Goal**: Become national standard, demonstrate measurable impact

---

#### 3.1 Geographic Expansion

**Multi-Zone Support**
- Expand beyond Austin to:
  - Other Texas cities (Houston, Dallas, San Antonio - different zones)
  - Other states (start with Southern states, similar climates)
  - Eventually: All USDA zones
- Zone-specific plant databases
- Region-specific guilds
- Local nursery partnerships in each region

**Why it matters**: Food forests work everywhere. Model proven in Austin can replicate nationally.

**How it works**: Scale database structure. Partner with local permaculture groups in each region to curate plant lists.

---

#### 3.2 Advanced Features

**Seasonal Visualization**
- Show property changing over time
- Year 1, Year 3, Year 5, Year 10 views
- See trees maturing, canopy closing
- Understand succession

**Why it matters**: Food forests take years to mature. Seeing future helps users commit to long-term vision.

**How it works**: 3D visualization or illustrated views. Calculate growth rates, show projections.

---

**Shade Mapping**
- Calculate sun exposure by season
- Use solar path algorithms + tree heights
- Show "full sun / part shade / full shade" zones
- Adjust plant recommendations based on actual light levels

**Why it matters**: Light is critical. Most users misjudge shade patterns.

**How it works**: Solar geometry calculations. Input existing tree heights. Generate heatmap.

---

**Photo Recognition**
- Upload photo of existing plant
- AI identifies species
- Auto-adds to map
- Suggests companions

**Why it matters**: Many users don't know what they already have. Identifying plants removes barrier to designing around them.

**How it works**: Integration with plant identification APIs or train custom model.

---

**Soil Test Integration**
- Users upload soil test results
- AI interprets recommendations
- Suggests amendments
- Tracks soil improvement over years

**Why it matters**: Soil health is foundation of success. Most users don't understand test results.

**How it works**: Parse common soil test formats (A&M AgriLife, etc.). Claude explains results, suggests fixes.

---

**Recipe Integration**
- Based on plants in design, suggest recipes
- Seasonal harvest guides
- Preservation methods (canning, freezing, drying)
- Use up abundant harvests

**Why it matters**: Growing is half the battle. Knowing what to do with harvests increases satisfaction and reduces waste.

**How it works**: Recipe database tagged by ingredients. Match to user's plant list. Seasonal filtering.

---

#### 3.3 Impact Reporting

**Individual Impact Dashboard**
- For each user, show:
  - Square feet of native habitat created
  - Number of pollinator plants
  - Estimated carbon sequestration (based on tree species/size)
  - Estimated water savings (reduced lawn irrigation)
  - Food production (pounds of harvest reported)
  - Soil health improvement metrics

**Why it matters**: People want to know their impact. Tangible numbers feel good. Also: data for grants.

**How it works**: Calculate from design data + user-reported outcomes. Conservative estimates to avoid overstating.

---

**Community Impact Reports**
- Aggregated data:
  - X users in Austin created Y food forests
  - Z square feet of native habitat
  - A pounds of food produced
  - B gallons of water saved
  - C trees planted
- Broken down by neighborhood, school, demographic
- Shareable infographics

**Why it matters**: Grant applications need impact data. City partnerships need proof of value. Marketing needs compelling stories.

**How it works**: Database queries + visualization tools. Generate quarterly/annual reports.

---

**Academic Partnerships**
- Partner with universities for research
- Publish papers on:
  - Urban food forest success rates
  - Biodiversity impacts
  - Soil carbon sequestration
  - Community health outcomes
- Legitimizes the work, attracts funding

**Why it matters**: Peer-reviewed research is gold standard for grants and policy change.

**How it works**: Collaborate with ecology, urban planning, public health departments. Provide data access for studies.

---

### 💰 Sustainability Model

**Revenue Streams** (all supporting free user access):
1. **Grants**: USDA, EPA, education, conservation foundations
2. **Donations**: Individual supporters, monthly memberships
3. **Nursery Affiliates**: Referral fees from partner nurseries
4. **Sponsorships**: Seed companies, tool makers, compost suppliers
5. **Premium Services** (maybe):
   - Detailed consultation for large properties
   - Custom design service for cities/schools
   - White-label licensing to conservation orgs

**Cost Structure**:
- Hosting: Firebase free tier → ~$50/month at scale
- AI: ~$0.10 per design → ~$100/month for 1000 designs
- Development: Volunteer (you) + AI assistance
- Marketing: Organic growth + grant-funded outreach
- Operations: Minimal until scaling

**Break-even**: ~$200/month to sustain at 1000 users

---

## Success Metrics

### March 2025 (Proof of Concept):
- ✅ Working prototype (design → recommendations → timeline)
- ✅ 5 test users complete full flow
- ✅ Positive feedback ("this is useful")
- ✅ Grant proposal draft complete

### End of 2025 (MVP Launch):
- 100 active users designing food forests
- 25 users implementing (planted at least one tree)
- 5 success stories (photos, testimonials)
- $10k in grants secured
- 2 school/community partnerships

### End of 2026 (Growth):
- 1,000 active users
- 200 implemented food forests
- Measurable impact (acres of habitat, pounds of food)
- Published impact report
- Expand to 3+ Texas cities
- $50k in grants + nursery partnerships

### End of 2027 (Scale):
- 10,000 users nationally
- 1,000 implemented food forests
- Academic research published
- National partnerships (Audubon, Native Plant Society)
- Self-sustaining via affiliates + grants

---

## Why This Will Work

**1. Solves a real problem**: People want to grow food regeneratively but don't know how

**2. Technology unlocks access**: AI makes expert knowledge available to everyone

**3. Data creates value**: No one else is collecting real-world success data at scale

**4. Education builds community**: People learn together, support each other

**5. Free removes barriers**: Anyone can participate, regardless of income

**6. Native plants align with conservation**: Grants and orgs want to support this

**7. Started small, scales big**: Austin proof of concept → Texas → National

**8. Multiple revenue streams**: Not dependent on single funding source

**9. Measurable impact**: We can prove this works with data

**10. Momentum is building**: Permaculture, regenerative ag, rewilding are all having a moment

---

## The Big Picture

Little Food Forests is more than an app. It's a movement to:
- **Reconnect people with food production**
- **Restore native ecosystems** one yard at a time
- **Build community resilience** through shared knowledge
- **Educate the next generation** about ecology and sustainability
- **Demonstrate that individual action** adds up to systemic change

If we help 10,000 people create food forests, we've:
- Restored hundreds of acres of native habitat
- Sequestered tons of carbon
- Produced thousands of pounds of food
- Taught ecological principles to thousands
- Created a replicable model for other communities

**That's worth building.** 🌱

---

*Last Updated: May 14, 2026*