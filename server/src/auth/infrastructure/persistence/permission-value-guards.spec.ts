import { permissionValueGuards } from '@auth/infrastructure/persistence/permission-value-guards';

describe('permissionValueGuards', () => {
  it('narrows supported resource types', () => {
    expect(permissionValueGuards.isResourceType('workspace')).toBe(true);
    expect(permissionValueGuards.isResourceType('unknown')).toBe(false);
  });

  it('narrows complete action lists', () => {
    expect(permissionValueGuards.isActionList(['read', 'write'])).toBe(true);
    expect(permissionValueGuards.isActionList(['read', 'unknown'])).toBe(false);
    expect(permissionValueGuards.isActionList('read')).toBe(false);
  });
});
