# Phase 4.1: App Shell (Layout) — ✅ COMPLETE

> **Source status:** The source heading explicitly marks this phase COMPLETE.

| # | Task | Status |
|---|---|---|
| 4.1.1 | Sidebar — logo, navigation (items + active state), user section at the bottom | ✅ Done |
| 4.1.2 | TopBar — breadcrumb, search input, notification bell, theme toggle, CTA "Import CSV" | ✅ Done |
| 4.1.3 | AppShell layout — composition of Sidebar + TopBar + Outlet content slot, integration with router | ✅ Done |

### Implemented (Phase 4.1)

- i18n setup: react-i18next + i18next, PL namespace, all strings via `t()`
- Atomic composition: TopBar (SearchButton, NotificationBell, ThemeToggle, ImportCsvLink, MobileMenuButton), Sidebar (SidebarNavLink, SectionLabel, UserSection)
- Design system reuse: shared/ui/Button (NotificationBell, ThemeToggle, MobileMenuButton), shared/ui/Badge (nav badge)
- Responsive: sidebar lg breakpoint (1024px), mobile overlay with backdrop, hamburger menu
- Route meta in app/routing/route-meta.ts (i18n keys)
- AppShell with Outlet, Navigate redirect / → /dashboard
- Placeholder pages: TransactionsPage, BudgetsPage (arrow functions)
- All pages converted to arrow functions, HomePage deleted
- tsc clean, 74 tests pass

---

## Source provenance

- Original source: legacy development plan
- Pre-atomization path: `docs/plans/roadmap.md`
- Original source lines: 174–195
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
