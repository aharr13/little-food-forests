import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import {
  MapPin, Sprout, TreeDeciduous, Home, ArrowRight
} from 'lucide-react';
import { GoogleMap, useJsApiLoader, Polygon, Marker, Polyline } from '@react-google-maps/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/Auth/AuthScreen';
import { LandingPage } from './components/Landing/LandingPage';
import { Dashboard } from './components/Dashboard/Dashboard';
import { LayersScreen } from './components/Canvas/LayersScreen';
import { FieldPhotoScreen } from './components/Photo/FieldPhotoScreen';
import { ConsultationScreen, PlantRecommendation, PlacementSuggestion } from './components/Consultation/ConsultationScreen';
import { PlanningScreen } from './components/Planning/PlanningScreen';
import { Wiki } from './components/Wiki/Wiki';
import { WikiAdmin } from './components/Wiki/WikiAdmin';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Shape, WaterFeature, ConversationMessage, RejectedPlant, PhotoReminder } from './types';
import { useWikiArticles } from './hooks/useWikiArticles';
import { useUserProfile } from './hooks/useUserProfile';
import { usePlantingTasks } from './hooks/usePlantingTasks';
import { useCareItems } from './hooks/useCareItems';
import { usePhotoReminders } from './hooks/usePhotoReminders';
import { generateTaskForShape } from './utils/taskGenerator';
import { generateCareItemsForShape } from './utils/careGenerator';
import { generatePhotoRemindersForProject } from './utils/photoReminderGenerator';

const libraries: ("drawing" | "places")[] = ['drawing', 'places'];

// Steps in the wizard
type Step = 'welcome' | 'address' | 'boundary' | 'layers';

// Main view modes
type ViewMode = 'dashboard' | 'project' | 'wiki' | 'wiki-admin' | 'consultation';

const DesignFlow = () => {
  const { currentUser } = useAuth();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>('welcome');

  // Project management
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  
  // Address & Map
  const [address, setAddress] = useState('');
  const [projectName, setProjectName] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 30.2672, lng: -97.7431 });

  // Boundary tracing
  const [boundaryPoints, setBoundaryPoints] = useState<{lat: number, lng: number}[]>([]);
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);

  // Plant shapes
  const [shapes, setShapes] = useState<Shape[]>([]);

  // Groundcover species selection
  const [groundcoverSpecies, setGroundcoverSpecies] = useState<string[]>([]);

  // Water & topography features
  const [waterFeatures, setWaterFeatures] = useState<WaterFeature[]>([]);

  // Wiki articles (fetched once, shared with Claude)
  const { articles: wikiArticles } = useWikiArticles();

  // User gardening profile — persisted to Firestore, passed to Claude
  const { profile: userProfile, updateProfile } = useUserProfile();

  // Planting tasks
  const { tasks: plantingTasks, upsertTask, completeStep, uncompleteStep } = usePlantingTasks(currentProjectId, currentUser?.uid ?? null);
  // Recurring care items
  const { careItems, upsertCareItem, completeItem: completeCareItem, snoozeItem: snoozeCareItem, deleteCareItem } = useCareItems(currentProjectId, currentUser?.uid ?? null);
  // Photo reminders
  const { photoReminders, upsertPhotoReminder, completePhotoReminder, snoozePhotoReminder } = usePhotoReminders(currentProjectId, currentUser?.uid ?? null);
  const [showPlanning, setShowPlanning] = useState(false);
  const [showFieldPhoto, setShowFieldPhoto] = useState(false);

  // AI Consultation
  const [showConsultation, setShowConsultation] = useState(false);
  const [consultationDocked, setConsultationDocked] = useState(true); // open as a side panel beside the map by default
  const [hasOpenedConsultation, setHasOpenedConsultation] = useState(false);
  const [pendingRecommendations, setPendingRecommendations] = useState<PlantRecommendation[]>([]);
  const [savedPlan, setSavedPlan] = useState<PlantRecommendation[]>([]);
  const [placementSuggestion, setPlacementSuggestion] = useState<PlacementSuggestion | null>(null);
  const [followUpPlantName, setFollowUpPlantName] = useState<string | null>(null);

  // Consultation history & rejected plants (persisted to Firestore)
  const [consultationHistory, setConsultationHistory] = useState<ConversationMessage[]>([]);
  const [rejectedPlants, setRejectedPlants] = useState<RejectedPlant[]>([]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  const onMapLoad = useCallback(() => {
    // Map instance is managed locally in each screen
  }, []);

  // Save project to Firestore
  async function saveProject() {
    if (!currentUser) return;

    const projectData = {
      userId: currentUser.uid,
      name: projectName || address || 'Untitled Project',
      address: address,
      location: mapCenter,
      boundary: {
        points: boundaryPoints
      },
      shapes: shapes,
      groundcoverSpecies: groundcoverSpecies,
      waterFeatures: waterFeatures,
      plantPlan: savedPlan,
      consultationHistory: consultationHistory,
      rejectedPlants: rejectedPlants,
      currentStep: currentStep,
      updatedAt: new Date(),
    };

    try {
      if (currentProjectId) {
        // Update existing project
        await updateDoc(doc(db, 'projects', currentProjectId), projectData);
        console.log('Project updated:', currentProjectId);
      } else {
        // Create new project
        const docRef = await addDoc(collection(db, 'projects'), {
          ...projectData,
          createdAt: new Date(),
        });
        setCurrentProjectId(docRef.id);
        console.log('New project created:', docRef.id);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    }
  }

  // Load project from Firestore
  async function loadProject(projectId: string) {
    try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentProjectId(projectId);
        setProjectName(data.name || '');
        setAddress(data.address || '');
        setMapCenter(data.location || { lat: 30.2672, lng: -97.7431 });
        setBoundaryPoints(data.boundary?.points || []);

        // Load and repair shapes if needed
        const loadedShapes = (data.shapes || []).map((shape: Shape) => {
          // Repair shapes missing type property
          if (!shape.type) {
            if (shape.center) {
              shape.type = 'circle';
            } else if (shape.points && shape.points.length === 2) {
              shape.type = 'line';
            } else if (shape.points && shape.points.length > 2) {
              shape.type = 'polygon';
            }
          }
          return shape;
        });
        setShapes(loadedShapes);

        // Load groundcover species
        setGroundcoverSpecies(data.groundcoverSpecies || []);

        // Load water features
        setWaterFeatures(data.waterFeatures || []);

        // Load saved plant plan
        setSavedPlan(data.plantPlan || []);

        // Load consultation history and rejected plants
        setConsultationHistory((data.consultationHistory || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)
        })));
        setRejectedPlants((data.rejectedPlants || []).map((plant: any) => ({
          ...plant,
          rejectedAt: plant.rejectedAt?.toDate ? plant.rejectedAt.toDate() : new Date(plant.rejectedAt)
        })));

        // Determine the correct step
        const savedStep = data.currentStep || 'welcome';
        const loadedBoundary = data.boundary?.points || [];

        // If boundary already exists and we're stuck on boundary step, advance to layers
        if (savedStep === 'boundary' && loadedBoundary.length >= 3) {
          setCurrentStep('layers');
        } else if (savedStep === 'boundary' || savedStep === 'address' || savedStep === 'welcome') {
          // If we have boundary, go to layers; otherwise respect saved step
          setCurrentStep(loadedBoundary.length >= 3 ? 'layers' : savedStep);
        } else {
          setCurrentStep(savedStep);
        }

        setShowDashboard(false);
        console.log('Project loaded:', projectId);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Failed to load project. Please try again.');
    }
  }

  // Auto-save when important state changes
  useEffect(() => {
    if (currentStep !== 'welcome' && currentUser) {
      saveProject();
    }
  }, [boundaryPoints, currentStep, shapes, groundcoverSpecies, waterFeatures, savedPlan, consultationHistory, rejectedPlants]);

  // The moment a plant becomes "establishing", make sure it has its watering /
  // care tasks — so marking it establishing (via the status buttons) creates the
  // daily watering right away, not only on the next planning-screen open.
  useEffect(() => {
    if (!currentProjectId || !currentUser) return;
    shapes.forEach(s => {
      if (s.status !== 'establishing' || !s.plantName) return;
      const shapeCare = careItems.filter(c => c.shapeId === s.id);
      // Regenerate if there's no care yet, OR it's old-structure care that lacks
      // the new daily watering item (this also re-dates seasonal care correctly).
      const hasWatering = shapeCare.some(c => c.id === `care_${s.id}_watering`);
      if (shapeCare.length === 0 || !hasWatering) {
        generateCareItemsForShape(s, currentProjectId, currentUser.uid).forEach(upsertCareItem);
      }
      // Remove stale/duplicate watering items (old ids) — keep the canonical one.
      shapeCare.forEach(c => {
        if (c.id !== `care_${s.id}_watering` && /water/i.test(c.title)) {
          deleteCareItem(c.id);
        }
      });
    });
  }, [shapes, careItems, currentProjectId, currentUser]);

  // Create new project
  function handleCreateProject() {
    setCurrentProjectId(null);
    setAddress('');
    setMapCenter({ lat: 30.2672, lng: -97.7431 });
    setBoundaryPoints([]);
    setShapes([]);
    setGroundcoverSpecies([]);
    setWaterFeatures([]);
    setConsultationHistory([]);
    setRejectedPlants([]);
    setCurrentStep('welcome');
    setIsDrawingBoundary(false);
    setShowDashboard(false);
    setViewMode('project');
  }

  // Open existing project
  function handleOpenProject(projectId: string) {
    loadProject(projectId);
    setViewMode('project');
  }

  // Return to dashboard
  function handleBackToDashboard() {
    setShowDashboard(true);
    setViewMode('dashboard');
  }


  // Step 2: Search for address
  const handleAddressSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setCurrentStep('boundary');
      } else {
        alert("Address not found. Please try again.");
      }
    });
  };

  // Step 3: Click to trace boundary
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!isDrawingBoundary || !e.latLng) return;
    
    const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setBoundaryPoints([...boundaryPoints, newPoint]);
  };

  const finishBoundary = () => {
    if (boundaryPoints.length < 3) {
      alert("Please click at least 3 points to outline your property");
      return;
    }
    setIsDrawingBoundary(false);
    setCurrentStep('layers');
  };

  // ============= RENDER STEPS =============

  // Show wiki
  if (viewMode === 'wiki') {
    return <Wiki onBack={() => setViewMode('dashboard')} />;
  }

  // Show wiki admin
  if (viewMode === 'wiki-admin') {
    return <WikiAdmin onBack={() => setViewMode('dashboard')} />;
  }

  // Show dashboard if user wants to see their projects
  if (showDashboard || viewMode === 'dashboard') {
    return (
      <Dashboard
        onCreateProject={handleCreateProject}
        onOpenProject={handleOpenProject}
        onOpenWiki={() => setViewMode('wiki')}
        onOpenWikiAdmin={() => setViewMode('wiki-admin')}
      />
    );
  }

  // Step 1: Welcome
  if (currentStep === 'welcome') {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="brand-large">
            <Sprout size={48} color="#059669" />
            <h1>Little Food Forests</h1>
          </div>
          
          <div className="welcome-text">
            <h2>Design Your Regenerative Food Forest</h2>
            <p>
              This tool helps you create a thriving food forest in your own yard using 
              permaculture principles. We'll guide you through:
            </p>
            <ul className="feature-list">
              <li><Home size={18} /> Mapping your property</li>
              <li><TreeDeciduous size={18} /> Placing trees and plants in layers</li>
              <li><Sprout size={18} /> Learning companion planting</li>
              <li><MapPin size={18} /> Planning your project step-by-step</li>
            </ul>
          </div>

          <button 
            className="btn-primary-large"
            onClick={() => setCurrentStep('address')}
          >
            Get Started <ArrowRight size={20} />
          </button>
          
          <button 
            onClick={handleBackToDashboard}
            className="btn-back"
            style={{ marginTop: '1rem' }}
          >
            ← Back to Dashboard
          </button>
          
          <p className="welcome-footer">No experience needed • Takes 10-15 minutes</p>
        </div>
      </div>
    );
  }

  // Step 2: Enter Address
  if (currentStep === 'address') {
    return (
      <div className="step-screen">
        <div className="step-content">
          <div className="step-header">
            <MapPin size={32} color="#059669" />
            <h2>Find Your Property</h2>
            <p>Enter your address to locate your yard on the map</p>
          </div>

          <form onSubmit={handleAddressSearch} className="address-form">
            <input 
              type="text" 
              placeholder="123 Main Street, Austin, TX" 
              value={address} 
              onChange={e => setAddress(e.target.value)}
              className="address-input"
              autoFocus
            />
            <button type="submit" className="btn-primary-large">
              Find My Property <ArrowRight size={20} />
            </button>
          </form>

          <button 
            onClick={() => setCurrentStep('welcome')}
            className="btn-back"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Trace Boundary
  if (currentStep === 'boundary') {
    return (
      <div className="map-screen">
        <div className="map-instructions">
          <div className="instruction-card">
            <Home size={24} color="#f59e0b" />
            <h3>Trace Your Property Boundary</h3>
            <p>
              {!isDrawingBoundary
                ? boundaryPoints.length >= 3
                  ? "Your boundary is already traced. You can continue or redraw it."
                  : "Click 'Start Tracing', then click on each corner of your yard to outline it."
                : boundaryPoints.length === 0
                  ? "👆 Click on the first corner of your property"
                  : `✓ Click on the next corner (${boundaryPoints.length} corners marked)`
              }
            </p>

            {!isDrawingBoundary ? (
              <div className="drawing-controls">
                {/* Show continue button if boundary already exists */}
                {boundaryPoints.length >= 3 && (
                  <button
                    className="btn-primary"
                    onClick={() => setCurrentStep('layers')}
                    style={{ marginBottom: '0.75rem' }}
                  >
                    Continue to Design <ArrowRight size={18} />
                  </button>
                )}
                <div className="button-group">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setBoundaryPoints([]);
                      setIsDrawingBoundary(true);
                    }}
                  >
                    {boundaryPoints.length >= 3 ? 'Redraw Boundary' : 'Start Tracing'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="drawing-controls">
                <p className="points-count">
                  {boundaryPoints.length === 0
                    ? "Click on a corner to start"
                    : boundaryPoints.length === 1
                      ? "1 corner marked - keep going!"
                      : `${boundaryPoints.length} corners marked`
                  }
                </p>
                <div className="button-group">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setBoundaryPoints([]);
                      setIsDrawingBoundary(true); // Keep in drawing mode
                    }}
                    disabled={boundaryPoints.length === 0}
                  >
                    Clear & Restart
                  </button>
                  <button
                    className="btn-primary"
                    onClick={finishBoundary}
                    disabled={boundaryPoints.length < 3}
                  >
                    Finish Boundary <ArrowRight size={18} />
                  </button>
                </div>
                {boundaryPoints.length > 0 && boundaryPoints.length < 3 && (
                  <p style={{fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0 0 0'}}>
                    Need at least 3 corners to finish
                  </p>
                )}
                <button
                  className="btn-back"
                  onClick={() => setIsDrawingBoundary(false)}
                  style={{ marginTop: '0.75rem' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Back to dashboard - always visible */}
            {!isDrawingBoundary && (
              <button
                onClick={handleBackToDashboard}
                className="btn-back"
                style={{ marginTop: '1rem' }}
              >
                ← Back to Dashboard
              </button>
            )}
          </div>
        </div>

        <div className="map-container">
          {isLoaded ? (
            <GoogleMap
              mapContainerClassName="map-wrapper"
              center={mapCenter}
              zoom={20}
              onLoad={onMapLoad}
              onClick={handleMapClick}
              mapTypeId="satellite"
              options={{
                disableDefaultUI: true,
                tilt: 0,
                gestureHandling: isDrawingBoundary ? 'none' : 'greedy',
                maxZoom: 24,
              }}
            >
              {/* Draw markers for each corner */}
              {boundaryPoints.map((point, index) => (
                <Marker
                  key={index}
                  position={point}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: index === 0 ? 10 : 6, // First point is bigger
                    fillColor: index === 0 ? '#fbbf24' : '#f59e0b', // First point is yellow
                    fillOpacity: 1,
                    strokeColor: 'white',
                    strokeWeight: 2,
                  }}
                  // No label - it blocks clicks!
                />
              ))}

              {/* Draw lines connecting the points */}
              {boundaryPoints.length > 1 && (
                <Polyline
                  path={boundaryPoints}
                  options={{
                    strokeColor: '#f59e0b',
                    strokeWeight: 3,
                    strokeOpacity: 0.8,
                  }}
                />
              )}

              {/* Draw the filled polygon only when complete */}
              {!isDrawingBoundary && boundaryPoints.length > 2 && (
                <Polygon
                  paths={boundaryPoints}
                  options={{
                    fillColor: '#f59e0b',
                    fillOpacity: 0.15,
                    strokeColor: '#f59e0b',
                    strokeWeight: 3,
                    clickable: false,
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="loading">Loading map...</div>
          )}
        </div>
      </div>
    );
  }

  // Step 4: Draw Layers
  if (currentStep === 'layers' && isLoaded) {
    return (
      <>
        {showPlanning && (
          <PlanningScreen
            projectId={currentProjectId || ''}
            userId={currentUser?.uid}
            projectName={projectName}
            address={address}
            mapCenter={mapCenter}
            boundaryPoints={boundaryPoints}
            shapes={shapes}
            tasks={plantingTasks}
            careItems={careItems}
            onCompleteStep={async (taskId, stepId) => {
              const updated = await completeStep(taskId, stepId);
              // When all planting steps are done, advance shape to 'establishing'
              if (updated?.status === 'completed' && currentProjectId) {
                setShapes(prev => prev.map(s =>
                  s.id === updated.shapeId ? { ...s, status: 'establishing' as const } : s
                ));
                // Generate care items for the newly establishing shape
                const shape = shapes.find(s => s.id === updated.shapeId);
                if (shape) {
                  const cares = generateCareItemsForShape(
                    { ...shape, status: 'establishing' as const },
                    currentProjectId,
                    currentUser?.uid ?? '',
                  );
                  cares.forEach(c => upsertCareItem(c));
                }
              }
            }}
            onUncompleteStep={uncompleteStep}
            onCompleteCareItem={completeCareItem}
            onSnoozeCareItem={snoozeCareItem}
            photoReminders={photoReminders}
            onCompletePhotoReminder={completePhotoReminder}
            onSnoozePhotoReminder={snoozePhotoReminder}
            onRescheduleTask={(taskId, date) => {
              const t = plantingTasks.find(x => x.id === taskId);
              if (t) upsertTask({ ...t, scheduledDate: date });
            }}
            onClose={() => setShowPlanning(false)}
          />
        )}
        {showFieldPhoto && currentProjectId && (
          <FieldPhotoScreen
            projectId={currentProjectId}
            userId={currentUser?.uid ?? ''}
            shapes={shapes}
            onClose={() => setShowFieldPhoto(false)}
          />
        )}
        <LayersScreen
          projectId={currentProjectId || ''}
          mapCenter={mapCenter}
          boundaryPoints={boundaryPoints}
          shapes={shapes}
          onShapesChange={setShapes}
          groundcoverSpecies={groundcoverSpecies}
          onGroundcoverSpeciesChange={setGroundcoverSpecies}
          waterFeatures={waterFeatures}
          onWaterFeaturesChange={setWaterFeatures}
          onBackToDashboard={handleBackToDashboard}
          onOpenConsultation={(plantName) => {
            if (plantName) setFollowUpPlantName(plantName);
            setShowConsultation(true);
            setHasOpenedConsultation(true);
          }}
          pendingRecommendations={pendingRecommendations}
          onClearRecommendations={() => setPendingRecommendations([])}
          placementSuggestion={placementSuggestion}
          onClearPlacement={() => setPlacementSuggestion(null)}
          onOpenPhotos={() => setShowFieldPhoto(true)}
          onOpenPlanning={() => {
            if (currentProjectId) {
              const taskByShapeId = new Map(plantingTasks.map(t => [t.shapeId, t]));
              const careByShapeId = new Map<string, boolean>();
              careItems.forEach(c => careByShapeId.set(c.shapeId, true));

              shapes.forEach(s => {
                if ((!s.status || s.status === 'planned') && s.plantName) {
                  // Generate/refresh planting tasks for planned shapes
                  const existing = taskByShapeId.get(s.id);
                  const isGeneric = existing?.steps.some(st =>
                    st.description.includes('Select a spot appropriate for a')
                  );
                  // Migrate old-structure tasks (that still carry first-30-days /
                  // year-one steps) to the new prep+plant-only structure.
                  const isOldStructure = existing?.steps.some(st =>
                    st.phase === 'first-30-days' || st.phase === 'year-one'
                  );
                  if (!existing || isGeneric || isOldStructure) {
                    const task = generateTaskForShape(s, currentProjectId, userProfile, currentUser?.uid ?? '');
                    if (task) {
                      if (existing) {
                        // Preserve user customizations across regeneration:
                        // the chosen planting date and any completed steps.
                        if (existing.scheduledDate) task.scheduledDate = existing.scheduledDate;
                        task.steps = task.steps.map(ns => {
                          const prev = existing.steps.find(os => os.title === ns.title);
                          return prev?.completed ? { ...ns, completed: true, completedAt: prev.completedAt } : ns;
                        });
                        const done = task.steps.filter(st => st.completed).length;
                        task.xpEarned = Math.round((done / Math.max(1, task.steps.length)) * task.xpReward);
                        task.status = done === task.steps.length ? 'completed' : done > 0 ? 'in_progress' : 'pending';
                        task.completedAt = existing.completedAt;
                      }
                      upsertTask(task);
                    }
                  }
                } else if (s.status === 'establishing' && s.plantName && !careByShapeId.get(s.id)) {
                  // Generate care items for establishing shapes that don't have any yet
                  const cares = generateCareItemsForShape(s, currentProjectId, currentUser?.uid ?? '');
                  cares.forEach(c => upsertCareItem(c));
                }
              });
            }
            setShowPlanning(true);
          }}
          onShapePlanted={(shape) => {
            if (!currentProjectId || !shape.plantName) return;
            const task = generateTaskForShape(shape, currentProjectId, userProfile, currentUser?.uid ?? '');
            if (task) upsertTask(task);
          }}
          consultationHistory={consultationHistory}
          onSaveConsultationHistory={setConsultationHistory}
          rejectedPlants={rejectedPlants}
          onSaveRejectedPlants={setRejectedPlants}
        />
        {hasOpenedConsultation && (
          <ConsultationScreen
            shapes={shapes}
            wikiArticles={wikiArticles}
            isVisible={showConsultation}
            savedPlan={savedPlan}
            onSavePlan={(recs) => setSavedPlan(recs)}
            onPlacementSuggestion={(s) => {
              setPlacementSuggestion(s);
              setShowConsultation(false); // go to map to see the suggestion
            }}
            onClose={() => setShowConsultation(false)}
            onGoToMap={(recommendations) => {
              setPendingRecommendations(recommendations);
              setShowConsultation(false);
            }}
            followUpPlantName={followUpPlantName}
            onFollowUpConsumed={() => setFollowUpPlantName(null)}
            userProfile={userProfile}
            onProfileUpdate={updateProfile}
            consultationHistory={consultationHistory}
            onSaveConsultationHistory={setConsultationHistory}
            rejectedPlants={rejectedPlants}
            onSaveRejectedPlants={setRejectedPlants}
            waterFeatures={waterFeatures}
            boundary={boundaryPoints}
            mapCenter={mapCenter}
            onApplyLayout={(newShapes) => {
              setShapes(prev => [...prev, ...newShapes]);
              // When docked, stay open so the advisor keeps the new plants in
              // context; when full-screen, drop to the map to see them.
              if (!consultationDocked) setShowConsultation(false);
            }}
            docked={consultationDocked}
            onToggleDock={() => setConsultationDocked(d => !d)}
          />
        )}
      </>
    );
  }

  return null;
};

// Main App component with authentication
const App = () => {
  const { currentUser } = useAuth();
  // Signed-out visitors see the public landing page; auth opens on demand.
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);

  if (!currentUser) {
    if (authMode) {
      return <AuthScreen initialMode={authMode} onBack={() => setAuthMode(null)} />;
    }
    return (
      <LandingPage
        onGetStarted={() => setAuthMode('signup')}
        onSignIn={() => setAuthMode('login')}
      />
    );
  }

  // Show design flow if logged in
  return <DesignFlow />;
};

// Wrap entire app with AuthProvider
export default function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}