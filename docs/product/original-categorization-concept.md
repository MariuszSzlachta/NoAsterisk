# Original Categorization and AI Concept

> **Source status:** Source-era product concept. AI fallback and caching are planned ideas unless verified elsewhere.

## Transaction Categorization

### Rules Engine (foundation)

Pattern Strategy / Chain of Responsibility — pluggable matchers:
- `ContainsMatcher` — whether the transaction title contains a keyword
- `ExactMatcher` — exact name matching
- `RegexMatcher` — advanced patterns (to be added later)

Rules managed through the admin panel:

| Keyword | Category | Sub-budget | Priority |
|---|---|---|---|
| BIEDRONKA | Groceries | Home | 1 |
| ŻABKA | Groceries | Home | 1 |
| PHU ANNA KOWALSKA | Groceries | Home | 2 |

### AI as fallback

When no rule matches → the transaction goes to the "unrecognized" queue → user triggers AI on demand (batch, not automatically per transaction).

**Contract with AI:**
- AI receives: `(transaction_id, anonymized_title, amount)` — only anonymized data
- AI returns: `(transaction_id, suggested_category, confidence)`
- User approves or corrects → the result is saved as a new rule in the admin panel

**AI as a one-time detective, not an engine running on every transaction.** Once a merchant → category mapping is established, it lives as a rule in the database and does not require further AI calls.

### AI Caching

AI categorization results are cached — the same anonymized title does not generate another API call. Cache at the command handler level.

---

## Current focused references

- [Categorization capability](./capabilities/categorization.md)
- [Categorization engine](../architecture/categorization-engine.md)
- [Categorization developer guide](../guides/backend/categorization-rules-module.md)


## Source provenance

- Original source: legacy product plan
- Pre-atomization path: `docs/product/product-concept.md`
- Original source lines: 126–159
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
