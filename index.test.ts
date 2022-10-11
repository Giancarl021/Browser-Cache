import { test, expect, jest, beforeEach } from '@jest/globals';

import LocalCache from './index';

const key = 'foo';
const value = 'bar';

const wait = (seconds: number) =>
    new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const setupSpy = () => {
    const proto = Object.getPrototypeOf(localStorage);

    const getItem = jest.spyOn(proto, 'getItem');
    const setItem = jest.spyOn(proto, 'setItem');
    const removeItem = jest.spyOn(proto, 'removeItem');
    const clear = jest.spyOn(proto, 'clear');

    return {
        getItem,
        setItem,
        removeItem,
        clear
    };
};

beforeEach(() => {
    jest.resetAllMocks();
});

const spy = setupSpy();

test('localStorage should exist as a global', () => {
    expect(localStorage).toBeDefined();
    expect(localStorage).toHaveProperty('setItem');
    expect(localStorage).toHaveProperty('getItem');
    expect(localStorage).toHaveProperty('removeItem');
    expect(localStorage).toHaveProperty('clear');
});

test('LocalCache should be able to save and retrieve an item', () => {
    const cache = LocalCache();

    expect(cache.has(key)).toBe(false);

    cache.set(key, value);

    expect(spy.setItem).toHaveBeenCalledTimes(1);

    expect(cache.has(key)).toBe(true);
    expect(cache.get(key)).toBe(value);

    cache.expire(key);

    expect(cache.has(key)).toBe(false);
    expect(() => cache.get(key)).toThrow();

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem).toHaveBeenCalledTimes(6);
});

test('LocalCache should not be able to get an expired item by the default TTL set to 0', () => {
    const cache = LocalCache({
        defaultTtl: 0
    });

    expect(cache.has(key)).toBe(false);

    cache.set(key, value);

    expect(() => cache.get(key)).toThrow();
    expect(cache.has(key)).toBe(false);

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(0);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.getItem).toHaveBeenCalledTimes(3);
});

test('LocalCache should not be able to get an expired item by a custom TTL set to 0', () => {
    const cache = LocalCache();

    expect(cache.has(key)).toBe(false);

    cache.set(key, value, 0);

    expect(() => cache.get(key)).toThrow();
    expect(cache.has(key)).toBe(false);

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(0);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.getItem).toHaveBeenCalledTimes(3);
});

test('LocalCache should not be able to get an expired item by a periodic check', async () => {
    const sec = 1200;
    const cache = LocalCache({
        checkPeriod: sec,
        defaultTtl: sec
    });

    expect(cache.has(key)).toBe(false);

    cache.set(key, value);

    expect(cache.get(key)).toBe(value);
    expect(cache.has(key)).toBe(false);

    await wait(sec);

    expect(() => cache.get(key)).toThrow();
    expect(cache.has(key)).toBe(false);

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem).toHaveBeenCalledTimes(5);
});
