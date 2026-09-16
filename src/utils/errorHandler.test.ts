import { describe, it, expect } from 'vitest';
import { getErrorMessage, isPermissionError } from './errorHandler';

describe('getErrorMessage', () => {
  it('returns fallback message when error has no response', () => {
    expect(getErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(getErrorMessage(undefined)).toBe('Ha ocurrido un error');
  });

  it('returns detail for 403 errors', () => {
    const error = { response: { status: 403, data: { detail: 'No autorizado' } } };
    expect(getErrorMessage(error)).toBe('No autorizado');
  });

  it('returns detail for 409 errors', () => {
    const error = { response: { status: 409, data: { detail: 'Conflicto detectado' } } };
    expect(getErrorMessage(error)).toBe('Conflicto detectado');
  });

  it('returns first validation message for 422 errors', () => {
    const error = { response: { status: 422, data: { detail: [{ msg: 'Campo requerido' }] } } };
    expect(getErrorMessage(error)).toBe('Campo requerido');
  });

  it('returns string detail for generic errors', () => {
    const error = { response: { status: 500, data: { detail: 'Error interno' } } };
    expect(getErrorMessage(error)).toBe('Error interno');
  });

  it('returns data.message when detail is not available', () => {
    const error = { response: { status: 500, data: { message: 'Mensaje alternativo' } } };
    expect(getErrorMessage(error)).toBe('Mensaje alternativo');
  });

  // El backend no siempre manda `detail` como string. Antes se devolvia tal
  // cual, asi que un objeto o un array terminaba renderizado como
  // "[object Object]" en el toast que ve el usuario.
  it('extracts the message when a 403 sends detail as an object', () => {
    const error = {
      response: { status: 403, data: { detail: { message: 'Permiso denegado' } } },
    };
    expect(getErrorMessage(error)).toBe('Permiso denegado');
  });

  it('extracts the first message when a 409 sends detail as an array', () => {
    const error = {
      response: { status: 409, data: { detail: [{ msg: 'Serie ya utilizada' }] } },
    };
    expect(getErrorMessage(error)).toBe('Serie ya utilizada');
  });

  it('never returns a non-string, whatever shape detail has', () => {
    const shapes = [
      { detail: { message: 'ok' } },
      { detail: [{ msg: 'ok' }] },
      { detail: 'ok' },
      { detail: {} },
      { detail: [] },
    ];
    for (const data of shapes) {
      for (const status of [403, 409, 422, 500]) {
        expect(typeof getErrorMessage({ response: { status, data } })).toBe('string');
      }
    }
  });

  it('falls back when the thrown value is not an object', () => {
    expect(getErrorMessage('fallo de red', 'Fallback')).toBe('Fallback');
    expect(getErrorMessage(new Error('boom'), 'Fallback')).toBe('Fallback');
  });
});

describe('isPermissionError', () => {
  it('returns true for 403 errors', () => {
    expect(isPermissionError({ response: { status: 403 } })).toBe(true);
  });

  it('returns false for non-403 errors', () => {
    expect(isPermissionError({ response: { status: 400 } })).toBe(false);
    expect(isPermissionError(null)).toBe(false);
  });
});
