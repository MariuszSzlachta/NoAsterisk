import type { MatcherType } from '#features/admin-rules/model/matcher-type';

interface FormValues {
  readonly keyword: string;
  readonly matcherType: MatcherType;
  readonly categoryId: string;
  readonly priority: number;
}

export const DEFAULT_FORM_VALUES: FormValues = {
  keyword: '',
  matcherType: 'Contains',
  categoryId: '',
  priority: 1,
};
