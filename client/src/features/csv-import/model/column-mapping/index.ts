// Column Mapping — public API
export { autoDetectMapping, normalizeHeader, isDomainField, hasRequiredFields } from './column-mapper';
export { HeaderHeuristicRegistry, defaultHeaderHeuristicRegistry } from './heuristics';
export type { HeaderHeuristic } from './heuristics';
export { BankProfileRegistry, defaultBankProfileRegistry, detectBankFromHeaders } from './bank-profiles';
