// Context keyword (ur./urodzona/born/d.o.b.) followed by date in DD.MM.YYYY, DD-MM-YYYY, or DD/MM/YY format
export const createBirthDatePattern = (): RegExp =>
  /\b(ur\.|ur:|data\s+ur\.|dat\.\s*ur\.|urodzony|urodzona|urodzenia|data\s+urodzenia|born|d\.o\.b\.?)\s*:?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/gi;
