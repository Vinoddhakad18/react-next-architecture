/**
 * useLocalStorage Hook Tests
 */

import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with default value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    const [value] = result.current;
    expect(value).toBe('defaultValue');
  });

  it('should initialize with value from localStorage if exists', () => {
    localStorage.setItem('testKey', JSON.stringify('storedValue'));
    const { result } = renderHook(() => useLocalStorage('testKey', 'defaultValue'));
    const [value] = result.current;
    expect(value).toBe('storedValue');
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));

    act(() => {
      const [, setValue] = result.current;
      setValue('newValue');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify('newValue'));
    expect(result.current[0]).toBe('newValue');
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      const [, setValue] = result.current;
      setValue((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should remove value from localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));

    act(() => {
      const [, , removeValue] = result.current;
      removeValue();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
    expect(result.current[0]).toBe('initialValue');
  });

  it('should handle complex objects', () => {
    const complexObject = { name: 'Test', age: 25, nested: { value: true } };
    const { result } = renderHook(() => useLocalStorage('object', complexObject));

    const [value] = result.current;
    expect(value).toEqual(complexObject);
  });
});
