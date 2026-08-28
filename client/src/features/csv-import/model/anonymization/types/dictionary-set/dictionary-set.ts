export interface DictionarySet {
  readonly firstNames: ReadonlySet<string>;
  readonly surnames: ReadonlySet<string>;
  readonly merchants: ReadonlySet<string>;
  readonly cities: ReadonlySet<string>;
  readonly phrases: ReadonlySet<string>;
}
