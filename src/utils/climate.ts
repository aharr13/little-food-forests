// src/utils/climate.ts
// Derive a climate/region profile from a project's coordinates so the advisor
// gives location-appropriate guidance instead of assuming Texas. Region boxes
// are deliberately coarse; the generic fallback keeps the app usable anywhere.

export interface ClimateProfile {
  region: string;           // human label, e.g. "Northern California"
  usdaZones: string;        // typical USDA hardiness zones for the area
  climateType: string;      // short climate descriptor
  nativePreference: string; // how to describe preferred plant palette
  summary: string;          // a sentence or two of guidance for the advisor
}

interface RegionDef extends ClimateProfile {
  minLat: number; maxLat: number; minLng: number; maxLng: number;
}

// Coarse bounding boxes for regions we have tuned guidance for.
const REGIONS: RegionDef[] = [
  {
    region: 'Texas',
    minLat: 25.5, maxLat: 36.7, minLng: -106.7, maxLng: -93.3,
    usdaZones: '7b–9a (8a/8b common)',
    climateType: 'hot humid-to-semiarid; hot summers, mild winters, summer rain inland',
    nativePreference: 'Texas-native and heat/drought-adapted',
    summary:
      'Texas summers are hot and often dry; alkaline soils are common. Favor heat- and drought-tolerant species, give afternoon shade to tender plants, and plant trees in fall so roots establish before summer.',
  },
  {
    region: 'Northern California',
    minLat: 36.3, maxLat: 42.1, minLng: -124.6, maxLng: -119.6,
    usdaZones: '9a–10a near the coast/valleys, 7–8 inland & foothills',
    climateType: 'Mediterranean — wet, mild winters and warm, dry summers',
    nativePreference: 'California-native and Mediterranean-climate (dry-summer) adapted',
    summary:
      'Northern California has a Mediterranean climate: rain falls in winter and summers are dry, so summer irrigation is essential for young plantings. Winters rarely hard-freeze near the coast and valleys (citrus, olives, figs, avocados do well), more frost inland. Favor drought-tolerant and dry-summer-adapted species, and plant in fall to use winter rains for establishment.',
  },
];

const GENERIC: ClimateProfile = {
  region: 'your area',
  usdaZones: 'your local USDA hardiness zone',
  climateType: 'temperate (Northern Hemisphere)',
  nativePreference: 'regionally-native and climate-adapted',
  summary:
    'Use plants suited to the local USDA hardiness zone and rainfall pattern; prefer regionally-native, climate-adapted species and plant trees in the dormant/cool season to establish before summer stress.',
};

export function getClimate(lat?: number, lng?: number): ClimateProfile {
  if (typeof lat === 'number' && typeof lng === 'number') {
    const hit = REGIONS.find(
      r => lat >= r.minLat && lat <= r.maxLat && lng >= r.minLng && lng <= r.maxLng,
    );
    if (hit) {
      const { region, usdaZones, climateType, nativePreference, summary } = hit;
      return { region, usdaZones, climateType, nativePreference, summary };
    }
  }
  return GENERIC;
}

// A compact block to drop into the advisor's system prompt.
export function formatClimateContext(c: ClimateProfile): string {
  return `LOCATION & CLIMATE (use this to choose appropriate species and timing):
  - Region: ${c.region}
  - USDA hardiness zones: ${c.usdaZones}
  - Climate: ${c.climateType}
  - ${c.summary}
Prefer ${c.nativePreference} plants. Do NOT recommend species that can't survive this climate/zone.`;
}
