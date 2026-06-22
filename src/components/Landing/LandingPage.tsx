// src/components/Landing/LandingPage.tsx
// Public marketing page shown to signed-out visitors. Tells the product story,
// foregrounds the Claude integration (the differentiator), and demos it with a
// deterministic replay before asking anyone to sign up.
import { useState } from 'react';
import {
  Map as MapIcon, Wand2, CalendarCheck, Camera,
  ShieldCheck, Braces, Database, Github, ArrowRight,
} from 'lucide-react';
import { ClaudeReplay } from './ClaudeReplay';
import './Landing.css';

const REPO_URL = 'https://github.com/aharr13/little-food-forests';

interface LandingPageProps {
  onGetStarted: () => void;   // opens auth in sign-up mode
  onSignIn: () => void;       // opens auth in log-in mode
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="landing">
      {/* Nav */}
      <header className="lp-nav">
        <div className="lp-brand">
          <img src="/logo.png" alt="" className="lp-brand-mark" width={30} height={30} />
          <span>Little Food Forests</span>
        </div>
        <nav className="lp-nav-actions">
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="lp-nav-link"><Github size={18} /> Code</a>
          <button className="lp-btn-ghost" onClick={onSignIn}>Sign in</button>
          <button className="lp-btn" onClick={onGetStarted}>Get started</button>
        </nav>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <HeroLogo />
        <div className="lp-badge">Permaculture design, powered by Claude</div>
        <h1>Turn your yard into a thriving food forest.</h1>
        <p className="lp-sub">
          Map your property, then let an AI advisor lay out a complete 7-layer permaculture
          guild — canopy to groundcover — reasoning about sun, soil, and companion planting.
          Plan the planting, then watch it grow with field photo time-lapses.
        </p>
        <div className="lp-hero-cta">
          <button className="lp-btn lp-btn-lg" onClick={onGetStarted}>Start designing — free <ArrowRight size={18} /></button>
          <a href="#demo" className="lp-btn-ghost lp-btn-lg">See how it works</a>
        </div>
        <div className="lp-trust">No credit card · Your data stays private · Works offline as an app</div>
      </section>

      {/* Wow: the Claude replay */}
      <section id="demo" className="lp-demo">
        <div className="lp-section-head">
          <h2>Watch Claude design a food forest</h2>
          <p>The advisor reads your actual map and returns structured plant placements — here's a real session, replayed.</p>
        </div>
        <ClaudeReplay />
      </section>

      {/* Feature walkthrough */}
      <section className="lp-features">
        <div className="lp-section-head">
          <h2>From bare lawn to layered ecosystem</h2>
          <p>Everything you need to design, plant, and steward a regenerative garden.</p>
        </div>
        <div className="lp-feature-grid">
          <Feature icon={<MapIcon size={22} />} title="Map your real property"
            body="Drop your address, trace your boundary on satellite imagery, and place plants on an interactive map with true-to-scale canopy spreads." />
          <Feature icon={<Wand2 size={22} />} title="Claude lays out your guild"
            body="Tell the advisor what you want to grow. It analyzes layer coverage and companion relationships, then auto-places a complete design onto the map." />
          <Feature icon={<CalendarCheck size={22} />} title="Plan it, then level up"
            body="Auto-generated planting and watering schedules by season, with a 50-level gamified progression that turns stewardship into a game." />
          <Feature icon={<Camera size={22} />} title="Watch it grow"
            body="Drop photo anchor points and shoot from the same spot over months — with a ghost-overlay guide — to build stop-motion time-lapses of your forest." />
        </div>
      </section>

      {/* How Claude powers this — the Anthropic-facing section */}
      <section className="lp-tech">
        <div className="lp-section-head">
          <h2>How Claude powers this</h2>
          <p>Not a chatbot bolted on — Claude is the design engine, integrated like a production system.</p>
        </div>
        <div className="lp-tech-grid">
          <TechCard icon={<ShieldCheck size={22} />} title="Secure by construction"
            body="The API key never touches the browser. Every request runs through an authenticated Firebase Cloud Function that enforces a model allowlist and a hard output-token ceiling." />
          <TechCard icon={<Braces size={22} />} title="Structured, spatial output"
            body="The advisor is given the live map state — layer coverage, guild gaps, sun aspect — and returns JSON placements that render straight onto the canvas. Reasoning in, geometry out." />
          <TechCard icon={<Database size={22} />} title="A knowledge base that grows itself"
            body="When the plant database lacks a species, Claude researches and writes a structured record for it on demand — the app's knowledge expands as you use it." />
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp-cta">
        <h2>Design your forest in an afternoon.</h2>
        <p>Free to use. Start with your address and let Claude do the heavy lifting.</p>
        <button className="lp-btn lp-btn-lg lp-btn-light" onClick={onGetStarted}>Get started <ArrowRight size={18} /></button>
      </section>

      <footer className="lp-footer">
        <div className="lp-brand"><img src="/logo.png" alt="" className="lp-brand-mark" width={26} height={26} /><span>Little Food Forests</span></div>
        <div className="lp-footer-meta">
          <span>React 19 · TypeScript · Firebase · Leaflet · Claude</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="lp-nav-link"><Github size={16} /> Source on GitHub</a>
        </div>
      </footer>
    </div>
  );
}

// Shows the embroidered logo.png if present (drop one in /public), otherwise the
// crisp vector mark — so the page looks finished either way.
function HeroLogo() {
  const [src, setSrc] = useState('/logo.png');
  return (
    <img
      src={src}
      onError={() => setSrc('/logo.svg')}
      alt="Little Food Forests"
      className="lp-hero-logo"
      width={140}
      height={140}
    />
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="lp-feature">
      <div className="lp-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function TechCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="lp-tech-card">
      <div className="lp-tech-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
