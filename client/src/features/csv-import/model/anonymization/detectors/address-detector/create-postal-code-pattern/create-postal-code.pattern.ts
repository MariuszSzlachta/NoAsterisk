export const createPostalCodePattern = (): RegExp =>
  /\b\d{2}-\d{3}\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]+)?\b/g;
