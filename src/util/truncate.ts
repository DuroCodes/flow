export const truncate = (str: string, num: number) => (str.length > num ? `${str.slice(0, num > 3 ? num - 3 : num)}...` : str);
