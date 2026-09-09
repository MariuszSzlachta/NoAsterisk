export const getBase64DecodedByteSize = (value: string): number => {
  const paddingBytes =
    Number(value.endsWith('=')) + Number(value.endsWith('=='));
  return Math.floor((value.length * 3) / 4) - paddingBytes;
};
