import { loginSchema, registerSchema } from '../schemas';

const validRegister = {
  firstName: 'Ana',
  email: 'ana@test.com',
  password: 'Abcdef12',
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
  it('acepta un registro válido con solo cuatro datos', () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it.each([
    ['sin mayúscula', 'abcdef12'],
    ['sin minúscula', 'ABCDEF12'],
    ['sin número', 'Abcdefgh'],
    ['muy corta', 'Abc12'],
  ])('rechaza una contraseña %s', (_caso, password) => {
    expect(registerSchema.safeParse({ ...validRegister, password }).success).toBe(false);
  });

  it('rechaza un nombre de menos de 2 caracteres', () => {
    expect(registerSchema.safeParse({ ...validRegister, firstName: 'A' }).success).toBe(false);
  });

  it('exige la declaración de edad y aceptación', () => {
    const result = registerSchema.safeParse({ ...validRegister, acceptTerms: false });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Debes confirmar tu edad y aceptar los términos');
  });
});
