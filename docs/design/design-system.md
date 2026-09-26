# NoAsterisk Design System — APPROVED & LOCKED

**Status:** Typography, color tokens, component variants — 100% APPROVED. No changes to this system in future requests.

## Brand
- **App name:** NoAsterisk
- **Canonical mark:** the blue rounded-square `N` in `client/public/favicon.svg`;
  the favicon and application shell use the same asset.
- **Currency:** PLN (Polish złoty, format: `1 234,56 zł`)
- **Language:** Polish
- **Tone:** Conservative, professional, finance-focused. Zero gamification, zero flashy colors.

## Typography — LOCKED
- **Font family:** Geist (UI) + Geist Mono (numbers/code)
- **Scale:**
  - 3xl · 600: `30px` (top-level KPI values)
  - xl · 600: `20px` (section/card titles)
  - base · 400: `14px` (body text)
  - Mono: `14px` (numbers, tabular figures, amounts)
- **Numbers:** Always tabular-numeric figures (`font-variant-numeric:tabular-nums`), right-aligned in tables
- **Formatting:** `font-family:'Geist Mono',monospace; font-variant-numeric:tabular-nums`

## Color Tokens — LOCKED
### Dark theme (lead)
```css
--bg: #0a0b0e;
--surface: #101319;
--surface-2: #161a22;
--surface-3: #1c212b;
--muted: #1a1f28;
--fg: #e8eaee;
--fg-muted: #8b929e;
--fg-subtle: #5d6470;
--border: #21262f;
--border-strong: #2c323d;
--primary: #3b82f6;
--primary-fg: #ffffff;
--primary-soft: rgba(59,130,246,.14);
--ring: #3b82f6;
--income: #34d399;
--income-soft: rgba(52,211,153,.13);
--expense: #fb7185;
--expense-soft: rgba(251,113,133,.13);
--warning: #fbbf24;
--warning-soft: rgba(251,191,36,.13);
--shadow: 0 1px 0 rgba(255,255,255,.02), 0 2px 8px rgba(0,0,0,.35);
```

### Light theme
```css
--bg: #f5f6f8;
--surface: #ffffff;
--surface-2: #fafbfc;
--surface-3: #f1f3f5;
--muted: #f1f3f5;
--fg: #101418;
--fg-muted: #5b6470;
--fg-subtle: #929aa5;
--border: #e8eaee;
--border-strong: #d8dce2;
--primary: #2563eb;
--primary-fg: #ffffff;
--primary-soft: rgba(37,99,235,.08);
--ring: #2563eb;
--income: #16a34a;
--income-soft: rgba(22,163,74,.10);
--expense: #e11d48;
--expense-soft: rgba(225,29,72,.08);
--warning: #d97706;
--warning-soft: rgba(217,119,6,.10);
--shadow: 0 1px 2px rgba(16,20,24,.04), 0 1px 3px rgba(16,20,24,.06);
```

### Category colors (both themes defined in [NoAsterisk.dc.html](./mockups/NoAsterisk.dc.html))
- **Groceries (Zakupy):** Green (#34d399 dark, #10b981 light)
- **Transport:** Blue (#60a5fa dark, #3b82f6 light)
- **Subscriptions:** Purple (#a78bfa dark, #8b5cf6 light)
- **Dining (Jedzenie):** Amber (#fbbf24 dark, #f59e0b light)
- **Bills (Rachunki):** Slate (#94a3b8 dark, #64748b light)
- **Entertainment (Rozrywka):** Rose/Red (#fb7185 dark, #f43f5e light)

### Chart palette (6 colors, Nivo)
Uses the 6 category colors above — distinguishable in both themes.

## Component Variants — LOCKED
- **Primary button:** `background:var(--primary); color:var(--primary-fg);`
- **Secondary button:** `border:1px solid var(--border-strong); background:var(--surface);`
- **Ghost button:** `background:transparent; color:var(--fg-muted);`
- **Destructive button:** `background:var(--expense-soft); color:var(--expense);`
- **Category tags:** `color:var(--cat-*); background:var(--cat-*-soft); padding:3px 9px;`
- **Status badges:** Income (green), Warning (amber), Neutral (slate)

## Layout constants
- **Sidebar width:** 236px
- **Topbar height:** 60px
- **Card padding:** 18px (or 20px for style tile)
- **Grid gap:** 14px (cards), 8px (toolbar buttons)
- **Max content width:** 1280px
- **Border radius:** 12px (cards), 9px (buttons/inputs), 8px (small), 6px (tags)

## Styling rules — NO CHANGES
1. **No gradients, no box-shadows** (except minimal card shadow via `--shadow` var)
2. **Inline styles only** — no stylesheets
3. **Flex/grid with `gap`** — never margin-based spacing
4. **Numbers right-aligned** in tables, tabular figures always
5. **Dark theme is the lead** — design dark first, light follows
6. **Both themes always** — every screen in both modes

## Polish data samples (for mocks)
- **Merchants:** BIEDRONKA, ŻABKA, ALLEGRO, BOLT, SPOTIFY, NETFLIX, ORLEN, PGE OBRÓT, UPC POLSKA, PRACODAWCA SP. Z O.O.
- **Categories:** Zakupy spożywcze, Transport, Subskrypcje, Jedzenie na mieście, Rachunki, Rozrywka
- **Account names:** Osobiste, Wspólne, Konto domowe

## Approved screens in [NoAsterisk.dc.html](./mockups/NoAsterisk.dc.html)
1. **Dashboard** ✓
2. **Transactions (AG Grid theme)** ✓
3. **Style tile** ✓

## Future screens (to build on request)
- Import Wizard (4-step flow)
- Budgets (detail + trend)
- Categorization Rules (table, inline edit, reorder)
- Import Profiles (bank config)
- Auth (login/register)
- Edge cases (empty, loading, errors, 409 conflict)
