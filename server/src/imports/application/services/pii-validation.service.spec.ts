import { PiiValidationService } from '@imports/application/services/pii-validation.service';
import {
  PiiRule,
  PiiViolationType,
} from '@imports/application/ports/pii-rule.port';

describe('PiiValidationService', () => {
  const alwaysDetects: PiiRule = {
    type: PiiViolationType.Iban,
    detect: () => true,
  };

  const neverDetects: PiiRule = {
    type: PiiViolationType.Email,
    detect: () => false,
  };

  it('returns violations from matching rules', () => {
    const service = new PiiValidationService([alwaysDetects, neverDetects]);

    const result = service.validate([
      { value: 'some value', field: 'description', rowIndex: 0 },
    ]);

    expect(result).toEqual([
      { type: PiiViolationType.Iban, field: 'description', rowIndex: 0 },
    ]);
  });

  it('returns empty array when no rules match', () => {
    const service = new PiiValidationService([neverDetects]);

    const result = service.validate([
      { value: 'clean text', field: 'description', rowIndex: 0 },
    ]);

    expect(result).toEqual([]);
  });

  it('validates multiple fields and aggregates violations', () => {
    const service = new PiiValidationService([alwaysDetects]);

    const result = service.validate([
      { value: 'row 0', field: 'description', rowIndex: 0 },
      { value: 'row 1', field: 'description', rowIndex: 1 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]?.rowIndex).toBe(0);
    expect(result[1]?.rowIndex).toBe(1);
  });

  it('reports multiple violations per field when multiple rules match', () => {
    const rule1: PiiRule = { type: PiiViolationType.Iban, detect: () => true };
    const rule2: PiiRule = { type: PiiViolationType.Phone, detect: () => true };
    const service = new PiiValidationService([rule1, rule2]);

    const result = service.validate([
      { value: 'bad data', field: 'description', rowIndex: 5 },
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((v) => v.type)).toEqual([
      PiiViolationType.Iban,
      PiiViolationType.Phone,
    ]);
  });

  it('works with zero rules (no validation)', () => {
    const service = new PiiValidationService([]);

    const result = service.validate([
      { value: 'anything', field: 'description', rowIndex: 0 },
    ]);

    expect(result).toEqual([]);
  });
});
