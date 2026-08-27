// Polish street prefix (ul./al./os./pl.) + 1-4 words + house number with optional apartment
export const createAddressPattern = (): RegExp =>
  /\b(ul\.|al\.|os\.|pl\.|ulica|aleja|osiedle|plac)\s+(?:[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż]+[\s.]?){1,4}\s*\d{1,4}[A-Za-z]?(?:\/\d{1,4})?\b/gi;
