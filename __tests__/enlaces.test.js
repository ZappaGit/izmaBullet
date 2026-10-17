import { extraerTokensRecuperacion } from '../src/cuenta/enlaces';

describe('extraerTokensRecuperacion', () => {
  test('lee los tokens del fragmento de un enlace de recuperación', () => {
    const url = 'izmabullet://cuenta/nueva-clave#access_token=acceso-1&refresh_token=refresco-1&type=recovery';

    expect(extraerTokensRecuperacion(url)).toEqual({ accessToken: 'acceso-1', refreshToken: 'refresco-1' });
  });

  test('devuelve null si el enlace no es de recuperación', () => {
    const url = 'izmabullet://cuenta/nueva-clave#access_token=a&refresh_token=b&type=signup';

    expect(extraerTokensRecuperacion(url)).toBeNull();
  });

  test('devuelve null si faltan tokens o el enlace no trae fragmento', () => {
    expect(extraerTokensRecuperacion('izmabullet://cuenta/nueva-clave')).toBeNull();
    expect(extraerTokensRecuperacion('izmabullet://cuenta/nueva-clave#type=recovery')).toBeNull();
  });

  test('devuelve null para una URL vacía o indefinida', () => {
    expect(extraerTokensRecuperacion(null)).toBeNull();
    expect(extraerTokensRecuperacion(undefined)).toBeNull();
  });
});
