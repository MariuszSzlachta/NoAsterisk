import {
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  readonly content: string;
  readonly children: ReactNode;
  readonly placement?: Placement;
  readonly noFlip?: boolean;
  readonly flipThreshold?: number;
  readonly clampTo?: string;
  readonly edgeGap?: number;
}

const TOOLTIP_CLASSES =
  'pointer-events-none fixed z-[9999] max-w-48 rounded-md bg-surface-3 px-2.5 py-1.5 text-xs text-foreground shadow-card';

const DEFAULT_FLIP_THRESHOLD = 60;
const DEFAULT_EDGE_GAP = 8;
const GAP = 8;

export const Tooltip = ({
  content,
  children,
  placement = 'top',
  noFlip = false,
  flipThreshold = DEFAULT_FLIP_THRESHOLD,
  clampTo: _clampTo,
  edgeGap = DEFAULT_EDGE_GAP,
}: TooltipProps): React.JSX.Element => {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node || !triggerRef.current) {
        return;
      }
      // Clamp after render
      const tipRect = node.getBoundingClientRect();
      const vw = window.innerWidth;

      if (tipRect.right > vw - edgeGap) {
        node.style.left = `${vw - tipRect.width - edgeGap}px`;
        node.style.transform = 'translateY(-100%)';
      }
      if (tipRect.left < edgeGap) {
        node.style.left = `${edgeGap}px`;
        node.style.transform = 'translateY(-100%)';
      }
    },
    [edgeGap],
  );
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});

  const show = useCallback((): void => {
    const el = triggerRef.current;
    if (!el) {
      return;
    }

    const rect = el.getBoundingClientRect();

    let resolved = placement;
    if (!noFlip) {
      if (placement === 'top' && rect.top < flipThreshold) {
        resolved = 'bottom';
      }
      if (
        placement === 'bottom' &&
        window.innerHeight - rect.bottom < flipThreshold
      ) {
        resolved = 'top';
      }
    }

    const centerX = rect.left + rect.width / 2;

    switch (resolved) {
      case 'top':
        setStyle({
          top: rect.top - GAP,
          left: centerX,
          transform: 'translate(-50%, -100%)',
        });
        break;
      case 'bottom':
        setStyle({
          top: rect.bottom + GAP,
          left: centerX,
          transform: 'translate(-50%, 0)',
        });
        break;
      case 'left':
        setStyle({
          top: rect.top + rect.height / 2,
          left: rect.left - GAP,
          transform: 'translate(-100%, -50%)',
        });
        break;
      case 'right':
        setStyle({
          top: rect.top + rect.height / 2,
          left: rect.right + GAP,
          transform: 'translate(0, -50%)',
        });
        break;
    }

    setVisible(true);
  }, [placement, noFlip, flipThreshold]);

  const hide = useCallback((): void => {
    setVisible(false);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        tabIndex={0}
        aria-describedby={id}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {visible &&
        createPortal(
          <span
            ref={tooltipRef}
            id={id}
            role="tooltip"
            className={TOOLTIP_CLASSES}
            style={style}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
};
