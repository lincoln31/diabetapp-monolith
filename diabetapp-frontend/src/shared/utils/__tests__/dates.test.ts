import {
  ageFromDateOfBirth,
  dateOfBirthToISO,
  formatDateInput,
  isFutureDate,
  isRealDate,
} from '../dates';

describe('formatDateInput', () => {
  it.each([
    ['15', '15'],
    ['1503', '15/03'],
    ['15031990', '15/03/1990'],
    ['15/03/1990', '15/03/1990'],
    ['abc15', '15'],
  ])('formatea "%s" como "%s"', (entrada, esperado) => {
    expect(formatDateInput(entrada)).toBe(esperado);
  });
});

describe('dateOfBirthToISO', () => {
  it('convierte a ISO en UTC', () => {
    expect(dateOfBirthToISO('15/03/1990')).toBe('1990-03-15T00:00:00.000Z');
  });
});

describe('isRealDate', () => {
  it.each([
    ['15/03/1990', true],
    ['29/02/2024', true], // Año bisiesto
    ['31/02/2000', false],
    ['29/02/2023', false],
    ['15-03-1990', false],
  ])('%s → %s', (fecha, esperado) => {
    expect(isRealDate(fecha)).toBe(esperado);
  });
});

describe('ageFromDateOfBirth e isFutureDate', () => {
  it('calcula la edad descontando el cumpleaños no cumplido', () => {
    const hoy = new Date();
    const cumpleMañana = new Date(hoy.getFullYear() - 20, hoy.getMonth(), hoy.getDate() + 1);
    const texto = `${String(cumpleMañana.getDate()).padStart(2, '0')}/${String(
      cumpleMañana.getMonth() + 1,
    ).padStart(2, '0')}/${cumpleMañana.getFullYear()}`;

    expect(ageFromDateOfBirth(texto)).toBe(19);
  });

  it('detecta fechas futuras', () => {
    expect(isFutureDate(`01/01/${new Date().getFullYear() + 1}`)).toBe(true);
    expect(isFutureDate('01/01/1990')).toBe(false);
  });
});
