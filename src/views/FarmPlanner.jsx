// =========== FILE: src/views/FarmPlanner.jsx ===========
// This is the updated code with the User Preferences form.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThermometerSun, MapPin, Sprout, Target as TargetIcon, Heart, Leaf } from 'lucide-react';
import { GoogleMap, useJsApiLoader, DrawingManager } from '@react-google-maps/api';

// --- IMPORTANT: Paste your Google Maps API Key here ---
const GOOGLE_MAPS_API_KEY = "AIzaSyChZ0IFbDyRGE117RVk9zNZbhFtcuhUWw0";

// --- Map Configuration ---
const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '8px',
  marginTop: '20px',
};
const libraries = ['drawing'];

// --- Our Mini Plant Database ---
const plantDatabase = [
    { name: 'Tomatoes', plantingMonths: [1, 2, 3, 6, 7] },
    { name: 'Peppers', plantingMonths: [2, 3, 4, 6, 7] },
    { name: 'Basil', plantingMonths: [2, 3, 4, 5, 6, 7] },
    { name: 'Okra', plantingMonths: [3, 4, 5, 6] },
];


const FarmPlanner = () => {
  const [zipCode, setZipCode] = useState('');
  const [climateData, setClimateData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plantRecommendations, setPlantRecommendations] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 30.2672, lng: -97.7431 });
  
  // --- NEW State for User Preferences ---
  const [preferences, setPreferences] = useState({
      favoriteVeggies: '',
      dietaryGoals: {
          moreIron: false,
          moreVitaminC: false,
          moreProtein: false,
      },
      medicinalHerbs: '',
  });

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  // --- Handlers for the new preference form ---
  const handlePreferenceChange = (e) => {
      const { name, value } = e.target;
      setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleGoalChange = (e) => {
      const { name, checked } = e.target;
      setPreferences(prev => ({
          ...prev,
          dietaryGoals: {
              ...prev.dietaryGoals,
              [name]: checked
          }
      }));
  };


  // --- Existing Functions (no changes needed here) ---
  useEffect(() => {
    if (climateData) {
      const currentMonth = new Date().getMonth();
      const recommendations = plantDatabase.filter(plant => plant.plantingMonths.includes(currentMonth));
      setPlantRecommendations(recommendations);
    }
  }, [climateData]);

  const handleZipChange = (event) => {
    const value = event.target.value.replace(/\D/g, '');
    if (value.length <= 5) setZipCode(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (zipCode.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setClimateData(null);
    setPlantRecommendations([]);
    try {
      const geocodeResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${GOOGLE_MAPS_API_KEY}`);
      const geocodeData = await geocodeResponse.json();
      if (geocodeData.status !== 'OK' || !geocodeData.results[0]) throw new Error('Could not find location for that ZIP code.');
      const location = geocodeData.results[0].geometry.location;
      setMapCenter(location);
      const climateResponse = await fetch(`https://phzmapi.org/${zipCode}.json`);
      if (!climateResponse.ok) throw new Error('Could not find climate data for that ZIP code.');
      const data = await climateResponse.json();
      setClimateData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- STYLES ---
  const plannerStyle = { padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' };
  const formSectionStyle = { marginTop: '40px', textAlign: 'left' };
  const labelStyle = { fontWeight: 'bold', marginBottom: '5px', display: 'block' };
  const checkboxLabelStyle = { marginLeft: '10px', cursor: 'pointer' };

  return (
    <div className="card">
      <div style={plannerStyle}>
        <h1 className="card-title" style={{textAlign: 'center', border: 'none'}}>AI Farm Planner</h1>
        <p style={{marginBottom: '30px'}}>Enter your location, outline your garden beds, and set your preferences.</p>
        
        {/* --- Location Form --- */}
        <form onSubmit={handleSubmit}>
          {/* ... input and button from before ... */}
        </form>

        {/* --- Map and Climate Results --- */}
        <div style={{marginTop: '40px'}}>
            {isLoading && <p>Loading location data...</p>}
            {error && <div style={{color: 'red'}}><p><strong>Error:</strong> {error}</p></div>}
            
            {isLoaded ? (
              <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={18} mapTypeId="satellite">
                <DrawingManager options={{ drawingControl: true, drawingControlOptions: { position: window.google.maps.ControlPosition.TOP_CENTER, drawingModes: [window.google.maps.drawing.OverlayType.POLYGON] }}} />
              </GoogleMap>
            ) : <p>Loading Map...</p>}
            {/* ... climateData and plantRecommendations display from before ... */}
        </div>

        {/* --- NEW User Preferences Form --- */}
        <div style={formSectionStyle} className="card">
            <h2 className="card-title" style={{border: 'none', padding: 0}}>Your Preferences</h2>
            
            {/* Favorite Veggies */}
            <div style={{marginBottom: '20px'}}>
                <label htmlFor="favoriteVeggies" style={labelStyle}><Leaf size={16} style={{marginRight: '8px'}}/>What are your "must-have" plants or vegetables?</label>
                <input type="text" id="favoriteVeggies" name="favoriteVeggies"
                    value={preferences.favoriteVeggies}
                    onChange={handlePreferenceChange}
                    placeholder="e.g., cherry tomatoes, jalapenos, basil"
                />
            </div>

            {/* Dietary Goals */}
            <div style={{marginBottom: '20px'}}>
                <label style={labelStyle}><TargetIcon size={16} style={{marginRight: '8px'}}/>Any specific dietary goals?</label>
                <div>
                    <input type="checkbox" id="moreIron" name="moreIron" checked={preferences.dietaryGoals.moreIron} onChange={handleGoalChange} />
                    <label htmlFor="moreIron" style={checkboxLabelStyle}>More Iron (e.g., spinach, kale)</label>
                </div>
                <div>
                    <input type="checkbox" id="moreVitaminC" name="moreVitaminC" checked={preferences.dietaryGoals.moreVitaminC} onChange={handleGoalChange} />
                    <label htmlFor="moreVitaminC" style={checkboxLabelStyle}>More Vitamin C (e.g., peppers, tomatoes)</label>
                </div>
                <div>
                    <input type="checkbox" id="moreProtein" name="moreProtein" checked={preferences.dietaryGoals.moreProtein} onChange={handleGoalChange} />
                    <label htmlFor="moreProtein" style={checkboxLabelStyle}>More Protein (e.g., beans, peas)</label>
                </div>
            </div>

            {/* Medicinal Herbs */}
            <div>
                <label htmlFor="medicinalHerbs" style={labelStyle}><Heart size={16} style={{marginRight: '8px'}}/>Any medicinal herbs you're interested in?</label>
                <input type="text" id="medicinalHerbs" name="medicinalHerbs"
                    value={preferences.medicinalHerbs}
                    onChange={handlePreferenceChange}
                    placeholder="e.g., echinacea, chamomile, yarrow"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default FarmPlanner;
