export const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
  if (!confirmPassword) {
    return 'auth.validation.confirmPasswordRequired';
  }

  if (password !== confirmPassword) {
    return 'auth.validation.passwordsMismatch';
  }

  return undefined;
};
