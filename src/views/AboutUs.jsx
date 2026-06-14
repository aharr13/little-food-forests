// =========== FILE: src/views/AboutUs.jsx ===========
// Corrected to remove duplicate React import.

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Users } from 'lucide-react';

const AboutUs = () => {
    // The story you wrote, formatted for display
    const aboutText = `
"In 2023, three teen chickens wandered up our driveway. We looked for the owners and posted in neighborhood sites but no one came forward to claim them. My wife was like, should we just have chickens now? And I was like ABSOLUTELY NOT. I am not chicken people. But then I came home from work and as I came in the fence the chickens ran to me like lumbering fat raptors and it was like I guess we have chickens now. Maybe I was always chicken people but just had nevermet a chicken before. 

We are not supposed to have chickens in my neighborhood, but its Austin and we're lesbians and I think people are just like, yeah that tracks. 

I'm very into thinking about the mechanisms of sentience and so we got two female serama chicks so that I could train them and record the journey and hopefully gain insights that would help me train myself. One of those hens was actually a kind of girly rooster and is now the father of generations. 

Sometimes I still feel wierd about being a crazy chicken Lady, but its like am I a crazy chicken lady, or the overlord of a flock of tiny dinosaurs? Reframing is a secret of the universe and an excellent tool in reality generation. 

We wanted to buy land and have a farm someday, but as I envisioned our future, I began to fear the realities of menopause in a lesbian relationship. Like what if our hot flashes don't sync up and someone gets murdered? So this is the project that I hope will give us distraction enough to survive it. I hope you are reading this because you want to buy some eggs and not in my obituary because I was stabbed by a thermostat knob. Like most humans, I want to have a life filled with meaning and purpose. Here is my iteration."
    `;

    return (
        <div className="card">
            <h1 className="card-title" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <Users /> About Us
            </h1>
            <div className="prose" style={{ whiteSpace: 'pre-wrap', fontStyle: 'italic', backgroundColor: '#fdfdfd', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--sunny-yellow)' }}>
                <ReactMarkdown>{aboutText}</ReactMarkdown>
            </div>
        </div>
    );
};

export default AboutUs;
