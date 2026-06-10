// Quell design tokens — "Modern Tournament" (dark, broadcast) language.
//
// The base is a single dark canvas (bg/surface/text/border neutrals) shared by
// every palette; the user-selectable palettes swap ONLY the accent family
// (Green / Indigo / Sunset / Teal). Win = accent, Loss = a fixed red, Halve =
// a warm neutral, so result coloring reads consistently across accents.
//
// Migration note: the original light theme named colors after golf
// (fairway/paper/ink/sand/flagRed). Those names are KEPT as aliases on every
// palette, mapped onto the new dark tokens, so existing `makeStyles(c)` screens
// render dark with zero edits while we migrate them to the semantic tokens and
// the `components/ui` primitives. New code should prefer the semantic names
// (bg/surface/text/accent/loss/…) and `makeType(c)` over the static `typography`.

export interface Palette {
  scheme: 'light' | 'dark'; // drives the status-bar icon color
  // ── Semantic tokens (prefer these going forward) ──
  bg: string;            // app background (deepest)
  surface: string;       // cards / sheets
  surfaceRaised: string; // raised cards / inputs / pressed rows
  text: string;          // primary text
  muted: string;         // secondary text
  border: string;        // hairlines / dividers
  accent: string;        // brand / primary action
  accentDark: string;    // accent pressed
  accentGlow: string;    // translucent accent wash (halos)
  win: string;           // a WIN — fixed green on EVERY theme (scorecard/reveal)
  winGlow: string;       // translucent win wash
  loss: string;          // loss / danger / decline — fixed red on every theme
  lossGlow: string;      // translucent loss wash
  halve: string;         // halved hole / neutral result
  halveGlow: string;     // translucent halve wash
  onAccent: string;      // text/icon on top of an accent fill

  // ── Legacy golf aliases (back-compat — point at the dark tokens above) ──
  fairway: string;       // → accent
  fairwayDark: string;   // → accentDark
  fairwaySoft: string;   // → accentGlow
  flagRed: string;       // → loss
  flagRedSoft: string;   // → lossGlow
  sand: string;          // → halve
  paper: string;         // → bg
  ink: string;           // → text
}

// A theme MODE = a full palette (distinct base + accent), not just an accent
// swap. Tournament Green is the fallback default; the others are the explore
// mockups. `pal()` fills the legacy golf-named aliases automatically.
type PalInput = Omit<Palette,
  'fairway' | 'fairwayDark' | 'fairwaySoft' | 'flagRed' | 'flagRedSoft' | 'sand' | 'paper' | 'ink'>;
function pal(p: PalInput): Palette {
  return {
    ...p,
    fairway: p.accent, fairwayDark: p.accentDark, fairwaySoft: p.accentGlow,
    flagRed: p.loss, flagRedSoft: p.lossGlow, sand: p.halve,
    paper: p.bg, ink: p.text,
  };
}

export const PALETTES: { id: string; name: string; colors: Palette }[] = [
  {
    id: 'fairway', name: 'Tournament Green',
    colors: pal({
      scheme: 'dark',
      bg: '#12161E', surface: '#1B212B', surfaceRaised: '#272F3B',
      text: '#F7F9FC', muted: '#AAB4C3', border: '#2D3543',
      accent: '#36E27D', accentDark: '#1FB85F', accentGlow: 'rgba(54,226,125,0.14)', onAccent: '#06231A',
      win: '#36E27D', winGlow: 'rgba(54,226,125,0.16)',
      loss: '#FF5A5F', lossGlow: 'rgba(255,90,95,0.14)', halve: '#E6EAF0', halveGlow: 'rgba(230,234,240,0.10)',
    }),
  },
  {
    id: 'augusta', name: 'Augusta Pine',
    colors: pal({
      scheme: 'dark',
      bg: '#0C1A14', surface: '#13251C', surfaceRaised: '#1B3326',
      text: '#F3F1E7', muted: '#A6B3A6', border: '#244033',
      accent: '#E7C982', accentDark: '#C9A961', accentGlow: 'rgba(231,201,130,0.16)', onAccent: '#20180A',
      win: '#5BD98C', winGlow: 'rgba(91,217,140,0.16)',
      loss: '#E0653F', lossGlow: 'rgba(224,101,63,0.16)', halve: '#EDEBDD', halveGlow: 'rgba(237,235,221,0.10)',
    }),
  },
  {
    id: 'broadcast', name: 'Broadcast Electric',
    colors: pal({
      scheme: 'dark',
      bg: '#0B1020', surface: '#141B33', surfaceRaised: '#1E2747',
      text: '#F4F7FF', muted: '#9AA6C4', border: '#283154',
      accent: '#4DE0C8', accentDark: '#2FB7A2', accentGlow: 'rgba(77,224,200,0.16)', onAccent: '#042420',
      win: '#46E08A', winGlow: 'rgba(70,224,138,0.16)',
      loss: '#FF5A6A', lossGlow: 'rgba(255,90,106,0.16)', halve: '#E6EAF5', halveGlow: 'rgba(230,234,245,0.10)',
    }),
  },
  {
    id: 'carbon', name: 'Carbon Luxe',
    colors: pal({
      scheme: 'dark',
      bg: '#0A0A0C', surface: '#16161A', surfaceRaised: '#202026',
      text: '#F5F5F7', muted: '#9C9CA6', border: '#2A2A31',
      accent: '#D4AF37', accentDark: '#B5942C', accentGlow: 'rgba(212,175,55,0.16)', onAccent: '#1A1505',
      win: '#38D87C', winGlow: 'rgba(56,216,124,0.16)',
      loss: '#FF5A5F', lossGlow: 'rgba(255,90,95,0.16)', halve: '#ECECEF', halveGlow: 'rgba(236,236,239,0.10)',
    }),
  },

  // ── Light themes (brighter, club-house feel). Win stays green / loss red. ──
  {
    // Blue + white + gold, with red. Crisp coastal/clubhouse look.
    id: 'coastal', name: 'Coastal Club',
    colors: pal({
      scheme: 'light',
      bg: '#EDF2F8', surface: '#FFFFFF', surfaceRaised: '#DFE7F1',
      text: '#15243B', muted: '#5C6B81', border: '#CFD9E7',
      accent: '#2E6FE0', accentDark: '#2057BE', accentGlow: 'rgba(46,111,224,0.12)', onAccent: '#FFFFFF',
      win: '#168A4B', winGlow: 'rgba(22,138,75,0.14)',
      loss: '#DC4640', lossGlow: 'rgba(220,70,64,0.12)', halve: '#C79A3E', halveGlow: 'rgba(199,154,62,0.18)',
    }),
  },
  {
    // Warm cream + classic golf green + gold. Soft, premium daytime feel.
    id: 'linen', name: 'Sunday Linen',
    colors: pal({
      scheme: 'light',
      bg: '#F5F1E8', surface: '#FFFFFF', surfaceRaised: '#EBE4D5',
      text: '#2A2620', muted: '#756C5C', border: '#E1D9C8',
      accent: '#1F7A45', accentDark: '#165C33', accentGlow: 'rgba(31,122,69,0.12)', onAccent: '#FFFFFF',
      win: '#1F7A45', winGlow: 'rgba(31,122,69,0.16)',
      loss: '#C24A3C', lossGlow: 'rgba(194,74,60,0.12)', halve: '#B7942F', halveGlow: 'rgba(183,148,47,0.18)',
    }),
  },
  {
    // Bright white + gold accent with a green win / red loss. Airy and clean.
    id: 'daybreak', name: 'Daybreak',
    colors: pal({
      scheme: 'light',
      bg: '#F1F4F8', surface: '#FFFFFF', surfaceRaised: '#E4EAF1',
      text: '#1B2330', muted: '#687486', border: '#D5DDE8',
      accent: '#D99A2B', accentDark: '#BC811C', accentGlow: 'rgba(217,154,43,0.14)', onAccent: '#241803',
      win: '#1A9E55', winGlow: 'rgba(26,158,85,0.14)',
      loss: '#DB4A4A', lossGlow: 'rgba(219,74,74,0.12)', halve: '#C4CCD8', halveGlow: 'rgba(196,204,216,0.45)',
    }),
  },
];

export const DEFAULT_PALETTE_ID = 'fairway';

export function getPalette(id: string | null | undefined): Palette {
  return (PALETTES.find((p) => p.id === id)?.colors) ?? PALETTES[0].colors;
}

// Back-compat static export (default palette). Screens not yet migrated still work.
export const colors = getPalette(DEFAULT_PALETTE_ID);

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 20, xl: 28, pill: 999 } as const;

// Font family keys — must match what `useFonts` loads in app/_layout.tsx.
// Display = Plus Jakarta Sans (modern, premium); body + numerals = Inter
// (tabular figures keep scorecards column-aligned).
export const fonts = {
  displayXBold: 'PlusJakartaSans_800ExtraBold',
  display: 'PlusJakartaSans_700Bold',
  displaySemi: 'PlusJakartaSans_600SemiBold',
  displayMed: 'PlusJakartaSans_500Medium',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

// Subtle dark-mode elevation. On dark surfaces shadows read faintly; we pair a
// soft shadow with the border hairline that cards already carry.
export const elevation = {
  card: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  sheet: { shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: -4 }, elevation: 12 },
  floating: { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
} as const;

// Full-bleed gradient stops keyed to match state, for the reveal backdrop and
// hero surfaces. Each returns [top, bottom] over the dark canvas.
export function gradients(c: Palette) {
  return {
    ahead:   [c.accentGlow, c.bg] as const,
    behind:  [c.lossGlow, c.bg] as const,
    neutral: [c.surface, c.bg] as const,
    hero:    [c.surfaceRaised, c.bg] as const,
  };
}

// Typography ramp with palette colors DECOUPLED from the font definitions.
// Screens call `const t = makeType(c)` inside makeStyles and spread `...t.heading`.
// Numerals use tabular-nums so scorecards/scores stay column-aligned.
export function makeType(c: Palette) {
  return {
    hero:         { fontFamily: fonts.displayXBold, fontSize: 40, lineHeight: 44, letterSpacing: -0.8, color: c.text },
    title:        { fontFamily: fonts.display,     fontSize: 28, lineHeight: 34, letterSpacing: -0.5, color: c.text },
    heading:      { fontFamily: fonts.displaySemi, fontSize: 20, lineHeight: 26, letterSpacing: -0.3, color: c.text },
    subheading:   { fontFamily: fonts.bodySemi,    fontSize: 17, lineHeight: 23, color: c.text },
    body:         { fontFamily: fonts.body,        fontSize: 16, lineHeight: 23, color: c.text },
    bodySemiBold: { fontFamily: fonts.bodySemi,    fontSize: 16, lineHeight: 23, color: c.text },
    label:        { fontFamily: fonts.bodyMed,     fontSize: 14, lineHeight: 19, color: c.text },
    caption:      { fontFamily: fonts.body,        fontSize: 13, lineHeight: 18, color: c.muted },
    overline:     { fontFamily: fonts.bodySemi,    fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' as const, color: c.muted },
    score:        { fontFamily: fonts.bodyBold,    fontSize: 22, fontVariant: ['tabular-nums'] as ('tabular-nums')[], color: c.text },
    scoreBig:     { fontFamily: fonts.displayXBold, fontSize: 56, lineHeight: 60, letterSpacing: -1, fontVariant: ['tabular-nums'] as ('tabular-nums')[], color: c.text },
  };
}

// Static typography ramp (default-palette colors). Existing screens spread these
// then override color with `c.ink`/`c.text`, so adding the Tournament font
// families here upgrades EVERY legacy screen to Space Grotesk / Inter at once
// without per-screen edits — the color override they already do makes the baked
// color here irrelevant. New code should prefer makeType(palette). Families are
// weight-specific (fontFamily wins over fontWeight on iOS), so no fontWeight.
export const typography = {
  title: { fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.5, color: colors.text },
  heading: { fontFamily: fonts.displaySemi, fontSize: 20, letterSpacing: -0.3, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, color: colors.text },
  bodySemiBold: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.text },
  caption: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
} as const;
