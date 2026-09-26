# Concept: Human-in-the-Loop Anonymization with Confidence Scoring

## Problem

Long bank transaction descriptions contain a mix of data:
- PII (names, addresses, account numbers) → must be masked
- Business data (store names, transfer titles) → must remain for categorization

An automatic algorithm cannot 100% distinguish "Jan Kowalski" (a person) from "Jan-Pol Sp. z o.o." (a company). Hence: **the algorithm suggests, the human approves**.

## Architecture

### Layer 1: Cell-level metadata

```typescript
export type ConfidenceLevel = 'HIGH' | 'PARTIAL' | 'LOW';

export interface AnonymizedCell {
  originalValue: string;       // Full original (visible only in browser RAM)
  anonymizedValue: string;     // Algorithm's proposal
  isModified: boolean;         // Whether the algorithm changed anything
  confidence: ConfidenceLevel; // Algorithm's confidence
  matchedBy: string;           // Diagnostics: "Regex IBAN", "Names dictionary", etc.
}

export interface ImportRow {
  id: string;
  isApproved: boolean;         // User approved changes in this row
  cells: Record<string, AnonymizedCell>;
}
```

### Layer 2: Plugin-based detection (identical to backend PII pattern)

```typescript
interface AnonymizationRule {
  name: string;
  confidence: ConfidenceLevel;
  detect(value: string, context: CellContext): DetectionResult[];
  anonymize(value: string, detections: DetectionResult[]): string;
}

interface DetectionResult {
  start: number;
  end: number;
  matchedText: string;
  replacement: string;
}

interface CellContext {
  columnName: string;       // "opis", "odbiorca", "tytuł"
  fullRow: string[];        // Entire row for cross-cell context
}
```

### Layer 3: Confidence scoring system

| Detection source | Confidence | UI action |
|---|---|---|
| Regex IBAN/PESEL/card/phone | HIGH | Auto-masking, user can see but doesn't need to confirm |
| Names dictionary + label context ("Odbiorca: **Jan**") | PARTIAL | Highlighted in yellow, user must confirm |
| Names dictionary WITHOUT context ("Jan" in the middle of description) | LOW | Highlighted in red, user decides |
| Cities/streets dictionary + address context | PARTIAL | Same as above |
| Safe column (amount, date, balance) | — | No processing |

### Layer 4: Role of dictionaries

Dictionaries (names, cities, streets) are **context detectors**, not blind maskers:
- They detect text fragments that MAY be PII
- They classify them based on context (preceding label, position in sentence)
- They emit a confidence level for the UI

Example:
```
Input:  "Przelew wychodzący - Jan Kowalski - Opłata za FV/2026/001 - ul. Kwiatowa 15 Warszawa"
Output: "Przelew wychodzący - [PERSON] - Opłata za FV/2026/001 - [ADDRESS]"
         ← kept →            ← PARTIAL →  ← kept →              ← PARTIAL →
```

In the grid, the user sees: original + proposal + reason. They approve or revert.

## Application flow

```
1. User selects a CSV file
2. PapaParse parses in the browser (RAM only)
3. Auto-detect encoding (UTF-8 / Windows-1250)
4. Dynamic column detector (looks for: description, title, recipient, counterparty, account)
5. Plugin pipeline processes each cell → AnonymizedCell[]
6. Grid displays:
   - HIGH confidence → green, auto-approved
   - PARTIAL → yellow, requires click
   - LOW → red, requires decision
7. User reviews, edits inline, approves rows
8. After approval → POST /imports (only anonymizedValue is sent to backend)
```

## Key principles

- **Original NEVER leaves the browser** — consistent with steering doc
- **Store/counterparty names are NOT masked** — needed for categorization
- **Dictionaries do NOT mask blindly** — they classify and suggest with confidence level
- **User is the final decision-maker** — algorithm assists, does not impose
- **Plugin pattern** — new rules = new class, zero changes in the processor

## Technical considerations to resolve

- Safari < 16.4 doesn't support lookbehind regex — use alternative approach (match + index offset)
- Large files (>10k rows) — consider Web Worker to avoid blocking the UI
- Load dictionaries lazily (dynamic import, don't bundle 50k names in main chunk)
- Encoding detection: `jschardet` for auto-detect + manual override in UI
