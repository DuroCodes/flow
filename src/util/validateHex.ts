export const validateHex = (hex: string) => {
  const regex = /^#[a-fA-F0-9]{6}/g;
  return regex.test(hex);
};
