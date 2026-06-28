export const CHART_MARGIN = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 60,
} as const;
export const CHART_MARGIN_COMPACT = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
} as const;

export const PIE_INNER_RADIUS = 0.5;
export const PIE_PAD_ANGLE = 0.7;
export const PIE_CORNER_RADIUS = 3;

export const DEFAULT_CHART_HEIGHT = 300;

// Typography
export const FONT_SANS = 'Geist, sans-serif';
export const FONT_MONO = "'Geist Mono', monospace";
export const FONT_SIZE_XS = 14;
export const FONT_SIZE_SM = 15;
export const FONT_SIZE_MD = 16;
export const FONT_SIZE_LG = 22;
export const FONT_FEATURE_SETTINGS = '"cv01", "ss01"';
export const LETTER_SPACING_TIGHT = '-0.16px';

// Colors (CSS variables)
export const COLOR_FG = 'var(--fg)';
export const COLOR_FG_MUTED = 'var(--fg-muted)';
export const COLOR_FG_SUBTLE = 'var(--fg-subtle)';
export const COLOR_BORDER = 'var(--border)';
export const COLOR_SURFACE = 'var(--surface)';

export const LEGEND_BOTTOM_RIGHT = {
  anchor: 'bottom-right' as const,
  direction: 'column' as const,
  translateX: 100,
  itemWidth: 80,
  itemHeight: 20,
};

export const LEGEND_BOTTOM_ROW = {
  anchor: 'bottom' as const,
  direction: 'row' as const,
  translateY: 56,
  itemWidth: 100,
  itemHeight: 18,
};
