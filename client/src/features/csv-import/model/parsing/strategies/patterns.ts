/** DD.MM.YYYY, DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MMM-YYYY (Polish month abbreviations) */
export const DATE_PATTERN = /^\d{2}[./-]\d{2}[./-]\d{2,4}$|^\d{4}-\d{2}-\d{2}$|^\d{2}-[A-ZĘÓĄŚŁŻŹĆŃa-ząćęłńóśźż]{3}-\d{4}$/;

/** "8 500,00", "-14,80", "+9 200,00", "-180,62 PLN", "3 840,67 EUR" */
export const AMOUNT_PATTERN = /^[+-]?\d[\d\s]*[.,]\d{2}(\s*[A-Z]{3})?$/;
