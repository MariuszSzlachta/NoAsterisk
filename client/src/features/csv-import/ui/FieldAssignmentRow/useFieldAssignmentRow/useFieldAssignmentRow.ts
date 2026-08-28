interface FieldAssignmentRowActions {
  readonly handleChange: (value: string) => void;
}

export const useFieldAssignmentRow = (
  header: string,
  onFieldChange: (column: string, value: string) => void,
): FieldAssignmentRowActions => {
  const handleChange = (newValue: string): void => {
    onFieldChange(header, newValue);
  };

  return { handleChange };
};
