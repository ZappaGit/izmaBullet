import {
  LONGITUD_MINIMA_CLAVE,
  validarAlta,
  validarCredenciales,
  validarNuevaClave,
  validarRecuperacion,
} from '../src/dominio/cuenta';

const altaValida = {
  nombre: 'Diego',
  email: 'diego@example.com',
  clave: 'contraseña-segura-1',
  repetirClave: 'contraseña-segura-1',
};

describe('validarCredenciales', () => {
  test('email y contraseña presentes no tienen errores', () => {
    expect(validarCredenciales({ email: 'diego@example.com', clave: 'x' })).toEqual({});
  });

  test('pide el email y comprueba que tenga forma de correo', () => {
    expect(validarCredenciales({ email: '', clave: 'x' }).email).toBeDefined();
    expect(validarCredenciales({ email: 'diego@', clave: 'x' }).email).toBeDefined();
    expect(validarCredenciales({ email: 'diego example.com', clave: 'x' }).email).toBeDefined();
  });

  test('pide la contraseña, sin exigir la longitud mínima al entrar', () => {
    expect(validarCredenciales({ email: 'diego@example.com', clave: '' }).clave).toBeDefined();
    expect(validarCredenciales({ email: 'diego@example.com', clave: 'corta' })).toEqual({});
  });
});

describe('validarAlta', () => {
  test('datos completos y coherentes no tienen errores', () => {
    expect(validarAlta(altaValida)).toEqual({});
  });

  test('el nombre es opcional pero acotado a 80 caracteres', () => {
    expect(validarAlta({ ...altaValida, nombre: '' })).toEqual({});
    expect(validarAlta({ ...altaValida, nombre: 'x'.repeat(81) }).nombre).toBeDefined();
  });

  test('la contraseña debe tener la longitud mínima de la guía', () => {
    expect(LONGITUD_MINIMA_CLAVE).toBe(12);
    const corta = 'x'.repeat(LONGITUD_MINIMA_CLAVE - 1);
    expect(validarAlta({ ...altaValida, clave: corta, repetirClave: corta }).clave).toBeDefined();
  });

  test('las dos contraseñas deben coincidir', () => {
    expect(validarAlta({ ...altaValida, repetirClave: 'otra-clave-distinta' }).repetirClave).toBeDefined();
  });

  test('valida también el email', () => {
    expect(validarAlta({ ...altaValida, email: 'no-es-correo' }).email).toBeDefined();
  });
});

describe('validarRecuperacion', () => {
  test('exige un email con forma de correo', () => {
    expect(validarRecuperacion({ email: '' }).email).toBeDefined();
    expect(validarRecuperacion({ email: 'diego@example.com' })).toEqual({});
  });
});

describe('validarNuevaClave', () => {
  test('aplica la longitud mínima y la repetición', () => {
    expect(validarNuevaClave({ clave: 'corta', repetirClave: 'corta' }).clave).toBeDefined();
    expect(validarNuevaClave({ clave: 'contraseña-segura-1', repetirClave: 'contraseña-segura-2' }).repetirClave)
      .toBeDefined();
    expect(validarNuevaClave({ clave: 'contraseña-segura-1', repetirClave: 'contraseña-segura-1' })).toEqual({});
  });
});
