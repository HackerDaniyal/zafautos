'use client';

import { useEffect, useState } from 'react';
import {
  Atom,
  BatteryCharging,
  Droplet,
  Flame,
  Fuel,
  Leaf,
  PlugZap,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Brand name normalization ────────────────────────────────────────────────

export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Simple Icons slug overrides (slug differs from the normalized brand name)
const SI_SLUG_OVERRIDES: Record<string, string> = {
  rollsroyce: 'rollsroyce',
  alfaromeo: 'alfaromeo',
};

// Brands NOT in Simple Icons (verified 404 for every slug variant):
// mercedes/mercedesbenz/mercedes-benz and lexus. These skip Simple Icons
// entirely and fall through to the letter-avatar fallback below.
const SKIP_SIMPLE_ICONS = new Set([
  'daihatsu',
  'isuzu',
  'hino',
  'mercedes',
  'mercedesbenz',
  'lexus',
]);

/**
 * Auto-fetched official logo URL derived from a make name.
 * Uses the Simple Icons CDN which serves real brand marks in their official
 * brand color. For brands not in Simple Icons, returns empty (MakeLogo then
 * renders its letter-avatar fallback).
 */
export function getSuggestedBrandLogoUrl(name?: string | null): string {
  const key = normalizeName(name ?? '');
  if (!key) return '';
  if (SKIP_SIMPLE_ICONS.has(key)) return ''; // skip Simple Icons for these brands
  const slug = SI_SLUG_OVERRIDES[key] ?? key;
  return `https://cdn.simpleicons.org/${slug}`;
}

function getBrandCandidates(name: string, url?: string | null): string[] {
  const list: string[] = [];
  if (url) list.push(url);
  const si = getSuggestedBrandLogoUrl(name);
  if (si) list.push(si); // only add Simple Icons if brand is in it
  // logo.clearbit.com fallback removed: the Clearbit Logo API was sunset and
  // the hostname no longer resolves (verified NODATA against the domain's
  // authoritative nameservers), so the request could only ever fail. Brands
  // without a Simple Icons mark now go straight to the letter avatar.
  return list;
}

interface MakeLogoProps {
  name: string;
  url?: string | null;
  className?: string;
}

export function MakeLogo({ name, url, className }: MakeLogoProps) {
  const candidates = getBrandCandidates(name, url);
  const [stage, setStage] = useState(0);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setStage(0), [name, url]);

  const src = candidates[stage];
  if (!src) {
    return (
      <span
        aria-label={`${name} logo`}
        className={cn(
          'flex items-center justify-center rounded-full bg-iron/20 font-[Oswald] uppercase text-pure-white',
          className
        )}
      >
        {(name ?? '?').charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={`${name} logo`}
      loading="lazy"
      draggable={false}
      onError={() => setStage((s) => s + 1)}
      className={cn('object-contain', className)}
    />
  );
}

// ─── Body type shapes ────────────────────────────────────────────────────────

const BODY_FILL = '#E8EBEF';
const GLASS_FILL = '#141A21';
const TIRE_FILL = '#171B22';
const HUB_FILL = '#4A5461';

interface BodyShape {
  body: string;
  glass?: string;
  wheels: number[];
  r?: number;
  bed?: boolean;
  box?: boolean;
  busWindows?: boolean;
  headrest?: boolean;
}

const BODY_SHAPES: Record<string, BodyShape> = {
  // Three-box saloon, nose facing right
  sedan: {
    body: 'M4.5 24 V19.5 Q4.5 17.2 8 16.6 L16.5 15.4 L22.5 9.4 Q23.5 8.4 25 8.4 H37 Q38.6 8.4 39.7 9.5 L45.6 15.4 L55.5 16.8 Q59.5 17.4 59.5 19.8 V24 Q59.5 25 58.5 25 H5.5 Q4.5 25 4.5 24 Z',
    glass: 'M25.2 10.6 H36.8 L42.2 15.2 H21.4 Z',
    wheels: [15.5, 49],
  },
  // Long roof estate
  wagon: {
    body: 'M5 24 V19.6 Q5 17.4 8.4 16.8 L17 15.4 L22.8 9.6 Q23.8 8.6 25.4 8.6 H35.6 Q38 8.6 39.3 10.5 L43.6 16.6 L56.4 17.6 Q59.5 18.1 59.5 20.2 V24 Q59.5 25 58.5 25 H6 Q5 25 5 24 Z',
    glass: 'M26 10.8 H35.4 L39 15.4 H20.6 Z',
    wheels: [15.5, 49.5],
  },
  // Steep rear hatch
  hatchback: {
    body: 'M8 24 V15.8 Q8 13.4 11 12.8 L18.6 11.4 L24.4 9.6 Q25.9 9.2 27.3 9.2 H32.6 Q35.2 9.2 36.7 11.2 L41.4 16.8 L49.4 17.9 Q53.5 18.5 53.5 20.8 V24 Q53.5 25 52.5 25 H9 Q8 25 8 24 Z',
    glass: 'M26.4 11.2 H32.4 L36.6 16.4 H15.9 Z',
    wheels: [16, 47],
  },
  // Sleek two-door fastback
  coupe: {
    body: 'M4.5 24 V20.5 Q4.5 18.2 8 17.6 L19 15.9 L27.5 10.8 Q28.6 10.2 30 10.2 H35.5 Q37.6 10.2 39 11.6 L44.8 17.2 L54.5 18.5 Q59 19.1 59 21.2 V24 Q59 25 58 25 H5.5 Q4.5 25 4.5 24 Z',
    glass: 'M29.4 12 H35 L40.2 16.4 H25.2 Z',
    wheels: [16, 48],
  },
  // Tall boxy utility
  suv: {
    body: 'M5 23.4 V16.5 Q5 14.2 8.6 13.6 L18 12.2 L23.6 6.8 Q24.8 5.8 26.4 5.8 H37 Q39.4 5.8 40.8 7.8 L45.4 14.2 L56 15.6 Q59.5 16.2 59.5 18.6 V23.4 Q59.5 25 57.5 25 H7 Q5 25 5 23.4 Z',
    glass: 'M26.6 8 H36.4 L40.2 13.4 H21 Z',
    wheels: [15.5, 49],
    r: 5,
  },
  // One-and-a-half box people mover
  minivan: {
    body: 'M6 23.6 V15 Q6 12.6 9.6 12 L20 10.4 L25.8 6.6 Q26.9 6 28.3 6 H38 Q40.4 6 41.6 8 L45.2 14 L55.5 15.4 Q58.5 15.9 58.5 18.2 V23.6 Q58.5 25 56.8 25 H7.7 Q6 25 6 23.6 Z',
    glass: 'M27.6 8.2 H37.4 L40.6 13.6 H22.6 Z',
    wheels: [16, 48.5],
  },
  // Full one-box van with short sloped nose
  van: {
    body: 'M7 24 V9.8 Q7 7.2 10 6.9 L44 5.6 Q47.5 5.5 49.4 8 L52.6 12.6 Q56 13.4 56.6 16.4 L57 23.4 Q57 25 55 25 H9 Q7 25 7 24 Z',
    glass: 'M43.8 8.2 L47.6 13.6 H38.6 V8.5 Z',
    wheels: [16.5, 48],
  },
  // Tiny tall kei car
  kei: {
    body: 'M9 24 V14 Q9 11 12.5 10.4 L20 9.2 L24.6 6.4 Q25.7 5.8 27 5.8 H33 Q36 5.8 37.4 8.4 L39.8 13 L44.5 14.2 Q47 15 47 17.4 V24 Q47 25 46 25 H10 Q9 25 9 24 Z',
    glass: 'M27 8 H32.4 L35 13 H22.6 Z',
    wheels: [16.5, 42.5],
    r: 4,
  },
  // Open-top roadster
  convertible: {
    body: 'M4.5 24 V20.8 Q4.5 18.5 8 17.9 L19 16.2 L27.5 13.4 Q28.6 13 30 13 H31.5 Q32.6 13 32.9 14.1 L33.6 16.6 L46 17.4 Q59 18.2 59 20.9 V24 Q59 25 58 25 H5.5 Q4.5 25 4.5 24 Z',
    glass: 'M31.2 13.6 L33 13.6 L34.2 17 L31.9 17 Z',
    wheels: [16, 48],
    headrest: true,
  },
  // Cab plus open cargo bed
  pickup: {
    body: 'M5 23 V17 Q5 16 6 16 H24 L26.5 10.4 Q27.5 8.8 29.4 8.8 H35 Q37.4 8.8 38.8 10.8 L42.6 16 L56 16.8 Q59.5 17.4 59.5 19.8 V23 Q59.5 25 57.5 25 H7 Q5 25 5 23 Z',
    glass: 'M30 10.8 H34.6 L38.2 15.6 H27.4 Z',
    wheels: [15, 49],
    r: 4.8,
    bed: true,
  },
  // Box-body commercial lorry
  truck: {
    body: 'M40.5 24 V13.5 Q40.5 12 42 12 H50 Q51.6 12 52.6 13.3 L56.4 18.2 L58.3 18.8 Q59.8 19.2 59.8 20.6 V24 Q59.8 25 58.5 25 H40.5 Z',
    glass: 'M43.5 14 H49.6 L52.4 18 H43.5 Z',
    wheels: [11, 24, 50],
    r: 4.2,
    box: true,
  },
  // Long passenger bus
  bus: {
    body: 'M5 24 V9.5 Q5 7.5 7.5 7.5 L52 6.5 Q54.8 6.5 55.8 9 L57.4 13.4 Q58 15.4 58 18 V24 Q58 25 57 25 H6 Q5 25 5 24 Z',
    glass: undefined,
    wheels: [14, 50],
    r: 4.6,
    busWindows: true,
  },
};

const GENERIC_SHAPE: BodyShape = BODY_SHAPES.hatchback;

function matchBodyShape(name: string): { shape: BodyShape } {
  const n = normalizeName(name);
  if (!n) return { shape: GENERIC_SHAPE };
  if (n.includes('pickup')) return { shape: BODY_SHAPES.pickup };
  if (n.includes('lorry') || n.includes('truck') || n.includes('tipper'))
    return { shape: BODY_SHAPES.truck };
  if (n.includes('bus') || n.includes('coach')) return { shape: BODY_SHAPES.bus };
  if (n.includes('kei') || n.includes('micro')) return { shape: BODY_SHAPES.kei };
  if (n.includes('convertible') || n.includes('cabriolet') || n.includes('roadster') || n.includes('spyder'))
    return { shape: BODY_SHAPES.convertible };
  if (n.includes('minivan') || n.includes('mpv')) return { shape: BODY_SHAPES.minivan };
  if (n.includes('van')) return { shape: BODY_SHAPES.van };
  if (n.includes('suv') || n.includes('crossover') || n.includes('cuv') || n.includes('offroad'))
    return { shape: BODY_SHAPES.suv };
  if (n.includes('coupe') || n.includes('gt')) return { shape: BODY_SHAPES.coupe };
  if (n.includes('hatch')) return { shape: BODY_SHAPES.hatchback };
  if (n.includes('wagon') || n.includes('estate') || n.includes('touring'))
    return { shape: BODY_SHAPES.wagon };
  if (n.includes('sedan') || n.includes('saloon') || n.includes('berlina'))
    return { shape: BODY_SHAPES.sedan };
  return { shape: GENERIC_SHAPE };
}

interface BodyTypeIconProps {
  name: string;
  className?: string;
}

export function BodyTypeIcon({ name, className }: BodyTypeIconProps) {
  const { shape } = matchBodyShape(name);
  return (
    <svg viewBox="0 0 64 32" role="img" aria-label={name} className={cn('h-8 w-auto', className)}>
      {shape.box && (
        <rect x="4" y="7.5" width="36" height="16" rx="1.5" fill={BODY_FILL} />
      )}
      <path d={shape.body} fill={BODY_FILL} />
      {shape.bed && (
        <rect x="7" y="17.2" width="16" height="2.4" rx="1.2" fill={GLASS_FILL} opacity="0.6" />
      )}
      {shape.busWindows &&
        [8.5, 16.5, 24.5, 32.5, 40.5].map((x) => (
          <rect key={x} x={x} y="9.5" width="6" height="4.6" rx="1" fill={GLASS_FILL} />
        ))}
      {shape.headrest && (
        <>
          <rect x="25.5" y="11.6" width="2.4" height="2.8" rx="1.2" fill={BODY_FILL} />
          <rect x="28.6" y="11.6" width="2.4" height="2.8" rx="1.2" fill={BODY_FILL} opacity="0.75" />
        </>
      )}
      {shape.glass && <path d={shape.glass} fill={GLASS_FILL} />}
      {shape.wheels.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="25" r={shape.r ?? 4.4} fill={TIRE_FILL} />
          <circle cx={cx} cy="25" r={(shape.r ?? 4.4) * 0.42} fill={HUB_FILL} />
        </g>
      ))}
    </svg>
  );
}

// ─── Fuel type icons ─────────────────────────────────────────────────────────

interface FuelStyle {
  Icon: LucideIcon;
  tint: string;
  badge?: { Icon: LucideIcon; cls: string };
}

function matchFuelStyle(n: string): FuelStyle {
  if (n.includes('hydrogen') || n === 'h2' || n.includes('fcev'))
    return { Icon: Atom, tint: 'text-violet-300' };
  if (n.includes('plugin') || n.includes('phev'))
    return {
      Icon: BatteryCharging,
      tint: 'text-teal-300',
      badge: { Icon: Leaf, cls: 'text-emerald-300' },
    };
  if (n.includes('hybrid'))
    return {
      Icon: Leaf,
      tint: 'text-emerald-300',
      badge: { Icon: Zap, cls: 'text-amber-300' },
    };
  if (n.includes('electric') || n === 'ev' || n.includes('bev') || n.includes('battery'))
    return { Icon: PlugZap, tint: 'text-sky-300' };
  if (n.includes('lpg') || n.includes('autogas') || n.includes('propane') || n.includes('cng') || n.includes('naturalgas'))
    return { Icon: Flame, tint: 'text-orange-300' };
  if (n.includes('diesel'))
    return {
      Icon: Fuel,
      tint: 'text-slate-200',
      badge: { Icon: Droplet, cls: 'text-amber-200' },
    };
  if (n.includes('petrol') || n.includes('gasoline') || n.endsWith('gas'))
    return { Icon: Fuel, tint: 'text-amber-300' };
  return { Icon: Fuel, tint: 'text-steel' };
}

interface FuelTypeIconProps {
  name: string;
  className?: string;
}

export function FuelTypeIcon({ name, className }: FuelTypeIconProps) {
  const { Icon, tint, badge } = matchFuelStyle(normalizeName(name));
  return (
    <span
      title={name}
      className={cn(
        'relative inline-flex size-8 items-center justify-center rounded-md border border-iron/30 bg-deep-carbon',
        className
      )}
    >
      <Icon className={cn('size-4', tint)} strokeWidth={2.2} />
      {badge && (
        <badge.Icon
          className={cn(
            'absolute -right-1 -top-1 size-3 rounded-full bg-carbon p-[1.5px]',
            badge.cls
          )}
          strokeWidth={2.5}
        />
      )}
    </span>
  );
}

// ─── Colors ──────────────────────────────────────────────────────────────────

export interface ColorPreset {
  name: string;
  hex: string;
}

export const CAR_COLOR_PRESETS: ColorPreset[] = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Pearl White', hex: '#F7F7F2' },
  { name: 'Silver', hex: '#C7CBD1' },
  { name: 'Grey', hex: '#808A93' },
  { name: 'Black', hex: '#101114' },
  { name: 'Red', hex: '#C0312A' },
  { name: 'Maroon', hex: '#6B1F2A' },
  { name: 'Blue', hex: '#2456A6' },
  { name: 'Navy Blue', hex: '#1B2A4A' },
  { name: 'Sky Blue', hex: '#7FB2D9' },
  { name: 'Green', hex: '#2E6B3E' },
  { name: 'Lime Green', hex: '#8DC63F' },
  { name: 'Yellow', hex: '#F2C94C' },
  { name: 'Gold', hex: '#B88D3E' },
  { name: 'Orange', hex: '#E07C24' },
  { name: 'Bronze', hex: '#8C6239' },
  { name: 'Brown', hex: '#5C4033' },
  { name: 'Beige', hex: '#D8CBB4' },
  { name: 'Purple', hex: '#5B3A8E' },
  { name: 'Pink', hex: '#D98CA6' },
];

export function isValidHex(value?: string | null): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value ?? '');
}

export function normalizeHexInput(value: string): string {
  const v = value.trim();
  const withHash = v.startsWith('#') ? v : `#${v}`;
  return withHash.slice(0, 7).toUpperCase();
}

interface ColorSwatchProps {
  hex?: string | null;
  name?: string;
  className?: string;
}

export function ColorSwatch({ hex, name, className }: ColorSwatchProps) {
  const valid = isValidHex(hex);
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="inline-block size-5 shrink-0 rounded-full border border-white/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25)]"
        style={valid ? { backgroundColor: hex! } : undefined}
        title={valid ? `${name ?? ''} ${hex}` : 'No color set'}
      >
        {!valid && (
          <span className="flex size-full items-center justify-center rounded-full bg-iron/20 text-[8px] text-steel">
            ?
          </span>
        )}
      </span>
      {hex ? (
        <span className="font-mono text-xs text-ash">{String(hex).toUpperCase()}</span>
      ) : (
        <span className="text-xs text-steel">—</span>
      )}
    </span>
  );
}
