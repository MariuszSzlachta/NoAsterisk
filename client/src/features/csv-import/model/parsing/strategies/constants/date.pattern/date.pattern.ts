/** DD.MM.YYYY, DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MMM-YYYY (Polish month abbreviations) */
export const DATE_PATTERN =
  /^\d{2}[./-]\d{2}[./-]\d{2,4}$|^\d{4}-\d{2}-\d{2}$|^\d{2}-[A-ZĘÓĄŚŁŻŹĆŃa-ząćęłńóśźż]{3}-\d{4}$/;
