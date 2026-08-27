// XX-XXX postal code followed by city name (1-2 words with Polish diacritics)
export const createPostalCodePattern = (): RegExp =>
  /\b\d{2}-\d{3}\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż-]+)?\b/g;
