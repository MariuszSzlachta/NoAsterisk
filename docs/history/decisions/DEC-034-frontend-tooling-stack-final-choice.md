# DEC-034 — Frontend Tooling Stack — Final Choice

## Source status

Historical decision recorded on 2026-06-25. The source provides an explicit decision statement. The source does not assign a separate lifecycle status to this record. Chronological presence does not prove current authority.

## Preserved decision record

**Date:** 2026-06-25

**Decision:** A complete frontend tooling stack has been established:

| Layer | Choice | License |
|-------|--------|---------|
| Bundler | Vite | MIT |
| Routing | React Router v7 | MIT |
| State (local) | Zustand + immer (via facade) | MIT |
| State (server) | TanStack Query v5 (via facade) | MIT |
| Grid | AG Grid Community (via facade) | MIT |
| UI Controls | shadcn/ui + Radix + Tailwind | MIT |
| Charts | Nivo (via facade) | MIT |
| Forms | React Hook Form | MIT |
| CSS | Tailwind CSS v4 | MIT |
| Icons | Lucide React | ISC |
| Dark mode | Enabled by default (Tailwind dark: , CSS variables) | — |
| Component dev | Storybook 10 | MIT |
| Design tokens | CSS variables (:root / .dark) | — |

**Justification for key choices:**

- **AG Grid Community** over TanStack Table: all required features are out-of-the-box (grouping, sorting, pagination, editable cells, row expand, custom cell renderers, virtualization). TanStack Table = headless, weeks of work to build a grid UI.
- **Nivo** over Recharts: better visual customization (the UI of charts must match the controls), better responsive options, more chart types.
- **shadcn/ui + Tailwind**: copy-paste components (zero dependency lock-in), Radix underneath (accessibility), utility CSS = fast prototyping, easy color palette via CSS variables.
- **React Hook Form**: lightweight, performant (uncontrolled), integrates with Fowler validation pattern (onSubmit → entity.validate()).
- **Storybook 8**: component isolation, dark mode testing in toolbar, autodocs, future: visual regression in CI. From the start — no switching later.

## Source provenance

- Original source: legacy decision log
- Pre-atomization path: `docs/history/decision-log.md`
- Original identifier: `DEC-034`
- Original order: 34 of 59
- Original source lines: 606–634
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
