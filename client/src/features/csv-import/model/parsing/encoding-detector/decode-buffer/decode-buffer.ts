export const decodeBuffer = (buffer: ArrayBuffer, encoding: string): string => {
  const decoder = new TextDecoder(encoding, { fatal: false });
  return decoder.decode(buffer);
};
