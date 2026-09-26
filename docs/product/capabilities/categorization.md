# Transaction Categorization — What It Does

## User Problem

Kasia imported 1200 transactions for the year. Each transaction is "BIEDRONKA", "BOLT", "ALLEGRO" — but without a category. She wants to know how much she spends on food vs transport vs entertainment. Manually tagging 1200 transactions takes hours of work.

**NoAsterisk lets you create simple rules — the system automatically assigns categories on every import.**

---

## How It Works

### 1. You create rules

A rule is one sentence: "If the transaction title **contains** the word **BIEDRONKA**, assign category **Groceries**."

| Field | Meaning | Example |
|-------|---------|---------|
| Keyword | What we look for in the title | "BIEDRONKA" |
| Match type | How we search | "Contains" (fragment) or "Exact" (entire title) |
| Category | What we assign | "Groceries" |
| Priority | Which rule wins on conflict | 1 (higher = more important) |

### 2. The system applies rules automatically

On every import the system scans new transactions and assigns categories:
- Checks rules from highest priority
- First matching rule wins
- Transaction gets one category (more can be added manually)

### 3. You can run it manually

If you added new rules after an import — click "Apply rules" and the system will re-scan uncategorized transactions.

---

## Rule Examples

| Keyword | Type | Category | Effect |
|---------|------|----------|--------|
| BIEDRONKA | Contains | Groceries | "ZAKUP BIEDRONKA KRAKÓW" → ✅ |
| BOLT | Contains | Transport | "BOLT RIDE 12.50" → ✅ |
| NETFLIX | Contains | Subscriptions | "NETFLIX.COM" → ✅ |
| ZUS | Contains | Insurance | "ZUS PRZELEW SKŁADKA" → ✅ |
| ALLEGRO | Contains | Online shopping | "ALLEGRO 92746284" → ✅ |

### Priorities — when rules "clash"

Problem: "BIEDRONKA FUEL STATION" — matches rule "BIEDRONKA → Groceries" BUT also "FUEL → Fuel".

Solution: give the "FUEL" rule a higher priority:
- "BIEDRONKA" priority 1 → Groceries
- "FUEL" priority 5 → Fuel

The system checks priority 5 first → "FUEL" matches → Fuel ✅

---

## Match Types

| Type | Behavior | When to use |
|------|----------|-------------|
| **Contains** | Searches for a fragment in the title (case-insensitive) | Most common — store names, services |
| **Exact** | The entire title must be identical | Rare — only for very specific titles |

---

## Limits and Rules

- Keyword: max 255 characters
- Priority: any number ≥ 0 (higher wins)
- One transaction = one category from auto-assignment (more can be added manually)
- Rules work per workspace (each user has their own)
- Case does NOT matter ("biedronka" = "BIEDRONKA" = "Biedronka")

---

## Limitations (current state)

| Limitation | Plan |
|-----------|------|
| Only two match types (Contains/Exact) | Regex + "Starts with" (planned) |
| No out-of-the-box rules | System seed rules: 500+ PL rules (planned Phase 5) |
| No rule statistics (how many times it fired) | Rule analytics (planned Phase 5) |
| No AI categorization | Provider-neutral AI-assisted categorization (planned post-MVP) |
| No rule import/export (CSV/JSON) | Bulk import (planned Phase 5) |
| Category must exist before adding a rule | Auto-creation from rule (under consideration) |

---

## Frequently Asked Questions

**Q: Do I have to create rules manually for every store?**
For now, yes. We plan a ready-made set of 500+ rules for Polish stores and services (Phase 5). And AI category suggestions (post-MVP).

**Q: What happens if I delete a category that is used in a rule?**
The rule still exists but assigns a "dead" category. Transactions with that category will keep it. Planned: warning when deleting a category.

**Q: Can I have the same transaction in two categories?**
Yes — but auto-categorization assigns only one. Additional categories are added manually on the transaction page.

**Q: Do rules work retroactively (on old transactions)?**
Yes — click "Apply rules" and the system will scan ALL uncategorized transactions (not just new ones).

---

*Updated: 2026-07-02*
