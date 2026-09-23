import { arrayBufferToBase64 } from '../base64';

const bufferFrom = (text: string): ArrayBuffer => new TextEncoder().encode(text).buffer as ArrayBuffer;

describe('arrayBufferToBase64', () => {
  // Vectores de prueba de RFC 4648 §10
  it.each([
    ['', ''],
    ['f', 'Zg=='],
    ['fo', 'Zm8='],
    ['foo', 'Zm9v'],
    ['foob', 'Zm9vYg=='],
    ['fooba', 'Zm9vYmE='],
    ['foobar', 'Zm9vYmFy'],
  ])('codifica %j como %j', (input, expected) => {
    expect(arrayBufferToBase64(bufferFrom(input))).toBe(expected);
  });
});
