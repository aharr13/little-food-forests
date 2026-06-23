// src/components/Landing/LandingPage.tsx
// Public marketing page shown to signed-out visitors. Tells the product story,
// foregrounds the Claude integration (the differentiator), and demos it with a
// deterministic replay before asking anyone to sign up.
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
          <img src="/logo.jpg" alt="" className="lp-brand-mark" width={30} height={30} />
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
        <div className="lp-hero-text">
          <div className="lp-badge">AI-guided permaculture design</div>
          <h1>Turn your yard into a thriving food forest.</h1>
          <p className="lp-sub">
            Map your property, then let an AI advisor lay out a full permaculture
            guild — canopy down to groundcover — reasoning about sun, water, and
            companion planting. Plan the planting, then track its growth with
            field photo time-lapses.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-btn lp-btn-lg" onClick={onGetStarted}>Start designing — free <ArrowRight size={18} /></button>
            <a href="#demo" className="lp-btn-ghost lp-btn-lg">See how it works</a>
          </div>
          <div className="lp-trust">No credit card · Private to your account · Installs on your phone</div>
        </div>
      </section>

      {/* Wow: the design replay */}
      <section id="demo" className="lp-demo">
        <div className="lp-section-head">
          <h2>Watch AI build your food forest</h2>
          <p>The advisor reads your map and returns structured plant placements. Here's the kind of reasoning it walks through, step by step.</p>
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
          <Feature icon={<Wand2 size={22} />} title="AI lays out your guild"
            body="Tell the advisor what you want to grow. It analyzes layer coverage and companion relationships, then auto-places a complete design onto the map." />
          <Feature icon={<CalendarCheck size={22} />} title="Plan it, then level up"
            body="Auto-generated planting and watering schedules by season, with a 50-level gamified progression that turns stewardship into a game." />
          <Feature icon={<Camera size={22} />} title="Watch it grow"
            body="Drop photo anchor points and shoot from the same spot over months — with a ghost-overlay guide — to build stop-motion time-lapses of your forest." />
        </div>
      </section>

      {/* Under the hood — the technical credibility section */}
      <section className="lp-tech">
        <div className="lp-section-head">
          <h2>Under the hood</h2>
          <p>Not a chatbot bolted on — the AI is the design engine, wired in like a production system.</p>
        </div>
        <div className="lp-tech-grid">
          <TechCard icon={<ShieldCheck size={22} />} title="Secure by construction"
            body="The API key never touches the browser. Every request runs through an authenticated Firebase Cloud Function that enforces a model allowlist and a hard output-token ceiling." />
          <TechCard icon={<Braces size={22} />} title="Structured, spatial output"
            body="The advisor is given the live map state — layer coverage, guild gaps, sun aspect — and returns JSON placements that render straight onto the canvas. Reasoning in, geometry out." />
          <TechCard icon={<Database size={22} />} title="A knowledge base that grows itself"
            body="When the plant database lacks a species, the model researches and writes a structured record for it on demand — the app's knowledge expands as you use it." />
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp-cta">
        <h2>Design your forest in an afternoon.</h2>
        <p>Free to use. Start with your address and let the AI do the heavy lifting.</p>
        <button className="lp-btn lp-btn-lg lp-btn-light" onClick={onGetStarted}>Get started <ArrowRight size={18} /></button>
      </section>

      <footer className="lp-footer">
        <div className="lp-brand"><img src="/logo.jpg" alt="" className="lp-brand-mark" width={26} height={26} /><span>Little Food Forests</span></div>
        <div className="lp-footer-meta">
          <span>React 19 · TypeScript · Firebase · Leaflet · Claude</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="lp-nav-link"><Github size={16} /> Source on GitHub</a>
        </div>
      </footer>
    </div>
  );
}

function HeroLogo() {
  return (
    <img
      src="/logo.jpg"
      alt="Little Food Forests"
      className="lp-hero-logo"
      width={240}
      height={240}
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
