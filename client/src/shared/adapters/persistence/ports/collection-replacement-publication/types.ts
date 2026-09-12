export interface CollectionReplacementPublication {
  readonly assertCurrent: () => void;
  readonly publish: (committedMutationVersion: number) => void;
}
