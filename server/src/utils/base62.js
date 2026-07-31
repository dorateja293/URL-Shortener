const CHARACTERS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const BASE = CHARACTERS.length;

/**
 * Convert a decimal number to Base62
 * @param {number} num
 * @returns {string}
 */
export const encodeBase62 = (num) => {
  if (num === 0) return "0";

  let encoded = "";

  while (num > 0) {
    const remainder = num % BASE;
    encoded = CHARACTERS[remainder] + encoded;
    num = Math.floor(num / BASE);
  }

  return encoded;
};

/**
 * Convert Base62 string back to decimal
 * @param {string} str
 * @returns {number}
 */
export const decodeBase62 = (str) => {
  let decoded = 0;

  for (const ch of str) {
    decoded = decoded * BASE + CHARACTERS.indexOf(ch);
  }

  return decoded;
};