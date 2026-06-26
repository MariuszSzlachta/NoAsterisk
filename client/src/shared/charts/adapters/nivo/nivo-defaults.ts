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
