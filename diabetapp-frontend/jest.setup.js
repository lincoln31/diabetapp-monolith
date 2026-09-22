/* eslint-disable no-undef */
// La app guarda los tokens en el almacenamiento seguro del sistema: en tests
// se sustituye por uno en memoria (spec fase 4, D-4.4).
jest.mock('expo-secure-store', () => {
  const store = new Map();

  return {
    __store: store,
    getItemAsync: jest.fn((key) => Promise.resolve(store.get(key) ?? null)),
    setItemAsync: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

// La app exige esta variable al arrancar
process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

beforeEach(() => {
  jest.requireMock('expo-secure-store').__store.clear();
});
