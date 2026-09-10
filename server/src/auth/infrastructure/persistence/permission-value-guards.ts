import type { Action, ResourceType } from '@auth/domain/permission.entity';

const RESOURCE_TYPES: readonly string[] = [
  'workspace',
  'sub_budget',
  'account',
];
const ACTIONS: readonly string[] = ['read', 'write', 'delete', 'admin'];

export const permissionValueGuards = {
  isResourceType: (value: string): value is ResourceType =>
    RESOURCE_TYPES.includes(value),
  isActionList: (value: unknown): value is Action[] =>
    Array.isArray(value) &&
    value.every(
      (item): item is Action =>
        typeof item === 'string' && ACTIONS.includes(item),
    ),
};
