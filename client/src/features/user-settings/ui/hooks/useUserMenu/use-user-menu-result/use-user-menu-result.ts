export interface UseUserMenuResult {
  readonly isOpen: boolean;
  readonly handleToggle: () => void;
  readonly handleClose: () => void;
  readonly handleSettings: () => void;
  readonly handleLogout: () => Promise<void>;
}
