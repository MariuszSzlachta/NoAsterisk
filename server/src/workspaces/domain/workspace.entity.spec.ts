import { Workspace } from './workspace.entity';

describe('Workspace', () => {
  describe('constructor invariants', () => {
    it('creates valid workspace', () => {
      const ws = new Workspace('ws-1', 'My Budget', new Date());
      expect(ws.id).toBe('ws-1');
      expect(ws.name).toBe('My Budget');
    });

    it.each([
      ['empty id', { id: '', name: 'Valid' }],
      ['empty name', { id: 'ws-1', name: '' }],
      ['whitespace name', { id: 'ws-1', name: '   ' }],
      ['name over 100 chars', { id: 'ws-1', name: 'a'.repeat(101) }],
    ])('throws for %s', (_, props) => {
      expect(() => new Workspace(props.id, props.name, new Date())).toThrow();
    });
  });

  describe('create', () => {
    it('generates unique id', () => {
      const ws1 = Workspace.create({ name: 'Test' });
      const ws2 = Workspace.create({ name: 'Test' });
      expect(ws1.id).not.toBe(ws2.id);
    });
  });
});
