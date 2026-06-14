// =========== FILE: src/views/MissionVision.jsx ===========

import React from 'react';
import { Eye, Target } from 'lucide-react';

const MissionVision = () => {
    // For now, we'll use placeholder text. We can build this out later.
    const missionStatement = "To ethically raise Serama chickens in a symbiotic food forest, producing exceptionally nutritious 'dinosaur eggs' that enhance well-being and bring a sense of wonder to our community.";
    const visionStatement = "To be a leading model of sustainable, small-scale poultry farming, celebrated for our commitment to animal welfare, ecological harmony, and the quirky, profound story of Tiny Dinosaur Farms.";

    return (
        <div className="card">
            <h1 className="card-title" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Eye /> Mission & Vision
            </h1>
            
            <div style={{marginTop: '20px'}}>
                <h2 style={{fontFamily: "'Nunito', sans-serif", display: 'flex', alignItems: 'center', gap: '8px'}}><Target /> Mission</h2>
                <p style={{fontSize: '1.1rem', fontStyle: 'italic'}}>{missionStatement}</p>
            </div>

            <div style={{marginTop: '30px'}}>
                <h2 style={{fontFamily: "'Nunito', sans-serif", display: 'flex', alignItems: 'center', gap: '8px'}}><Eye /> Vision</h2>
                <p style={{fontSize: '1.1rem', fontStyle: 'italic'}}>{visionStatement}</p>
            </div>
        </div>
    );
};

export default MissionVision;
