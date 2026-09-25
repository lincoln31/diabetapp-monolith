const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Codifica un `ArrayBuffer` a base64 sin depender de `btoa` (no está
 * garantizado en el runtime de React Native) — spec fase 6, D-6.6: hace
 * falta para escribir el PDF descargado con `expo-file-system`.
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];

    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 0x03) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
    result +=
      b1 === undefined ? '=' : BASE64_CHARS[((b1 & 0x0f) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
    result += b2 === undefined ? '=' : BASE64_CHARS[b2 & 0x3f];
  }

  return result;
};
