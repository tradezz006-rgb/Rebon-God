import type { Domain } from "@/contexts/DomainContext";

export type DomainStatus = "live" | "launching" | "soon";

export interface DomainWorld {
  id: string;
  label: string;
  status: DomainStatus;
  glimpse: string;
  /** Which app Domain this maps to when a learner enters it (null = not routable yet) */
  route: Domain | null;
  /** Orbit radius in design units (scaled to viewport at render time) */
  orbit: number;
  /** Seconds for one full revolution — bigger = slower */
  period: number;
  /** Starting angle offset in degrees, spread around the sun */
  phase: number;
  /** Relative planet size */
  size: number;
}

// Status colors are a strict, readable rule system:
//   live      → amber, pulsing (use it today)
//   launching → violet, solid  (building next)
//   soon      → grey,  ghost   (on the roadmap)
export const STATUS_COLOR: Record<DomainStatus, string> = {
  live: "#F59E0B",
  launching: "#7C3AED",
  soon: "#8B8B94",
};

export const STATUS_LABEL: Record<DomainStatus, string> = {
  live: "Live",
  launching: "Launching",
  soon: "Coming soon",
};

// The universe. Cloud is open today; Full Stack is next; the rest are the roadmap.
export const DOMAIN_WORLDS: DomainWorld[] = [
  {
    id: "cloud",
    label: "Cloud",
    status: "live",
    glimpse: "Real architectures, live incidents, the console on day one.",
    route: "fullstack",
    orbit: 165,
    period: 28,
    phase: 20,
    size: 1.2,
  },
  {
    id: "fullstack",
    label: "Full Stack",
    status: "launching",
    glimpse: "Ship features end to end — frontend, backend, production.",
    route: null,
    orbit: 240,
    period: 40,
    phase: 150,
    size: 1.05,
  },
  {
    id: "data",
    label: "Data Engineering",
    status: "soon",
    glimpse: "Pipelines, warehouses, and data that scales.",
    route: null,
    orbit: 310,
    period: 52,
    phase: 275,
    size: 1,
  },
  {
    id: "ml",
    label: "Machine Learning",
    status: "soon",
    glimpse: "Models, training, and decisions that scale.",
    route: null,
    orbit: 375,
    period: 64,
    phase: 60,
    size: 1,
  },
  {
    id: "security",
    label: "Cybersecurity",
    status: "soon",
    glimpse: "Threats, hardening, and the posture companies trust.",
    route: null,
    orbit: 435,
    period: 78,
    phase: 200,
    size: 0.95,
  },
  {
    id: "devops",
    label: "DevOps",
    status: "soon",
    glimpse: "Delivery pipelines and systems that never sleep.",
    route: null,
    orbit: 495,
    period: 92,
    phase: 320,
    size: 0.95,
  },
];

// Silent depth — faded outer nodes with no label, hinting at future tech waves.
export const GHOST_NODES = [
  { orbit: 575, period: 125, phase: 100, size: 0.55 },
  { orbit: 640, period: 160, phase: 250, size: 0.45 },
];
