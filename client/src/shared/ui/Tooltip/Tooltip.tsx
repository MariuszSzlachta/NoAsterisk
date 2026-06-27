import { useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type Placement = 'top' | 'bottom' | 'left' | 'right';

/** Lightweight infotip. String content only — use a Popover for rich content. */
interface TooltipProps {
  readonly content: string;
  readonly children: ReactNode;
  /** Preferred placement. Auto-flips if not enough space. */
  readonly placement?: Placement;
  /** Disable auto-flip (force exact placement). */
  readonly noFlip?: boolean;
  /** Override flip threshold in px (distance from edge to trigger flip). */
  readonly flipThreshold?: number;
  /** CSS selector for the clamp container. Defaults to 'main'. */
  readonly clampTo?: string;
  /** Gap from container edge in px. Default: 8. */
  readonly edgeGap?: number;
}

const BASE_CLASSES = 'pointer-events-none absolute z-50 w-max max-w-48 scale-95 rounded-md bg-surface-3 px-2.5 py-1.5 text-xs text-foreground opacity-0 shadow-card transition-all duration-150 group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100 group-focus-within/tooltip:scale-100 group-focus-within/tooltip:opacity-100';

const PLACEMENT_CLASSES: Record<Placement, string> = {
  top: 'bottom-full mb-2',
  bottom: 'top-full mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const ARROW_CLASSES: Record<Placement, string> = {
  top: 'absolute top-full border-4 border-transparent border-t-surface-3',
  bottom: 'absolute bottom-full border-4 border-transparent border-b-surface-3',
  left: 'absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-surface-3',
  right: 'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-3',
};

const DEFAULT_FLIP_THRESHOLD = 60;
const DEFAULT_EDGE_GAP = 8;

export const Tooltip = ({
  content,
  children,
  placement = 'top',
  noFlip = false,
  flipThreshold = DEFAULT_FLIP_THRESHOLD,
  clampTo = 'main',
  edgeGap = DEFAULT_EDGE_GAP,
}: TooltipProps): React.JSX.Element => {
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [adjustedPlacement, setAdjustedPlacement] = useState<Placement>(placement);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<CSSProperties>({});

  const handleEnter = (): void => {
    const wrapper = wrapperRef.current;
    const tooltip = tooltipRef.current;
    if (!wrapper || !tooltip) return;

    const triggerRect = wrapper.getBoundingClientRect();

    // Flip
    let resolved = placement;
    if (!noFlip) {
      if (placement === 'top' && triggerRect.top < flipThreshold) resolved = 'bottom';
      if (placement === 'bottom' && window.innerHeight - triggerRect.bottom < flipThreshold) resolved = 'top';
      if (placement === 'left' && triggerRect.left < 200) resolved = 'right';
      if (placement === 'right' && window.innerWidth - triggerRect.right < 200) resolved = 'left';
    }
    setAdjustedPlacement(resolved);

    // Horizontal clamping for top/bottom
    if (resolved === 'top' || resolved === 'bottom') {
      const tooltipWidth = tooltip.scrollWidth;
      const triggerCenter = triggerRect.left + triggerRect.width / 2;

      const scrollParent = wrapper.closest(clampTo) ?? document.documentElement;
      const containerRect = scrollParent.getBoundingClientRect();
      const minLeft = containerRect.left + edgeGap;
      const maxRight = containerRect.right - edgeGap;

      let idealLeft = triggerCenter - tooltipWidth / 2;
      const idealRight = triggerCenter + tooltipWidth / 2;

      if (idealLeft < minLeft) {
        idealLeft = minLeft;
      } else if (idealRight > maxRight) {
        idealLeft = maxRight - tooltipWidth;
      }

      const offsetFromTrigger = idealLeft - triggerRect.left;
      const arrowPos = triggerCenter - idealLeft;

      setTooltipStyle({ left: `${offsetFromTrigger}px` });
      setArrowStyle({ left: `${arrowPos}px`, transform: 'translateX(-50%)' });
    } else {
      setTooltipStyle({});
      setArrowStyle({});
    }
  };

  const isVertical = adjustedPlacement === 'top' || adjustedPlacement === 'bottom';

  return (
    <span
      ref={wrapperRef}
      className="group/tooltip relative inline-flex"
      tabIndex={0}
      aria-describedby={id}
      onMouseEnter={handleEnter}
      onFocus={handleEnter}
    >
      {children}
      <span
        ref={tooltipRef}
        id={id}
        role="tooltip"
        data-placement={adjustedPlacement}
        style={isVertical ? tooltipStyle : undefined}
        className={`${BASE_CLASSES} ${PLACEMENT_CLASSES[adjustedPlacement]}`}
      >
        {content}
        <span className={ARROW_CLASSES[adjustedPlacement]} style={isVertical ? arrowStyle : undefined} />
      </span>
    </span>
  );
};
