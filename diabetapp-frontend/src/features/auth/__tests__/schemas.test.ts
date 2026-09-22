import { loginSchema, registerSchema } from '../schemas';

const validRegister = {
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@test.com',
  phone: '300 123 4567',
  dateOfBirth: '15/03/1990',
  password: 'Abcdef12',
  confirmPassword: 'Abcdef12',
  acceptTerms: true as const,
};

describe('loginSchema', () => {
  it('acepta datos válidos', () => {
    expect(loginSchema.safeParse({ email: 'ana@test.com', password: 'x' }).success).toBe(true);
  });

  it('rechaza un correo inválido', () => {
    const result = loginSchema.safeParse({ email: 'sin-arroba', password: 'x' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Correo electrónico inválido');
  });
});

describe('registerSchema', () => {
  it('acepta un registro válido y quita los espacios del teléfono', () => {
    const result = registerSchema.safeParse(validRegister);

    expect(result.success).toBe(true);
    expect(result.data?.phone).toBe('3001234567');
  });

  it('acepta el teléfono vacío porque es opcional', () => {
    expect(registerSchema.safeParse({ ...validRegister, phone: '' }).success).toBe(true);
  });

  it.each([
    ['sin mayúscula', 'abcdef12'],
    ['sin minúscula', 'ABCDEF12'],
    ['sin número', 'Abcdefgh'],
    ['muy corta', 'Abc12'],
  ])('rechaza una contraseña %s', (_caso, password) => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password,
      confirmPassword: password,
    });

    expect(result.success).toBe(false);
  });

  it('exige que las contraseñas coincidan', () => {
    const result = registerSchema.safeParse({ ...validRegister, confirmPassword: 'Otra1234' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['confirmPassword']);
  });

  it('rechaza fechas inexistentes, futuras o de menores de 13 años', () => {
    const futura = `01/01/${new Date().getFullYear() + 1}`;
    const menor = `01/01/${new Date().getFullYear() - 5}`;

    expect(registerSchema.safeParse({ ...validRegister, dateOfBirth: '31/02/2000' }).success).toBe(
      false,
    );
    expect(registerSchema.safeParse({ ...validRegister, dateOfBirth: futura }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegister, dateOfBirth: menor }).success).toBe(false);
  });

  it('exige aceptar los términos', () => {
    const result = registerSchema.safeParse({ ...validRegister, acceptTerms: false });

    expect(result.success).toBe(false);
  });
});
