export interface ConfirmDialogField {
  readonly label: string;
  readonly type: 'text' | 'password';
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}
