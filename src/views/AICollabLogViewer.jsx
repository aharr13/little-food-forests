// =========== FILE: src/views/AICollabLogViewer.jsx ===========
// Its only job is to show the markdown file.

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain } from 'lucide-react';

const AICollabLogViewer = () => {
    const [markdown, setMarkdown] = useState('');
    
    useEffect(() => {
        // This fetches the content of your local markdown file.
        // Make sure you have the file at `src/AICollabLog.md`.
        fetch('/src/AICollabLog.md')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => setMarkdown(text))
            .catch(err => {
                console.error('Error fetching markdown:', err);
                setMarkdown('# Error\n\nCould not load `AICollabLog.md`. Please make sure the file exists at `/src/AICollabLog.md`.');
            });
    }, []);

    // Add a basic .prose style to your App.css if you haven't already
    // to style the markdown output nicely.
    return (
        <div className="card">
            <h1 className="card-title" style={{display: 'flex', alignItems: 'center', gap: '10px'}}><Brain /> AI Collaboration Log & Project Blueprint</h1>
            <div className="prose">
                <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
        </div>
    );
};

export default AICollabLogViewer;
