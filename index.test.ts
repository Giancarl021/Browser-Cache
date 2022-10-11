import { test, expect, jest, beforeEach } from '@jest/globals';

import BrowserCache from './index';

const KEY = 'foo';
const VALUE = 'bar';

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
    localStorage.clear();
    jest.clearAllMocks();
});

const spy = setupSpy();

test('localStorage should exist as a global', () => {
    expect(localStorage).toBeDefined();
    expect(localStorage).toHaveProperty('setItem');
    expect(localStorage).toHaveProperty('getItem');
    expect(localStorage).toHaveProperty('removeItem');
    expect(localStorage).toHaveProperty('clear');
});

test('BrowserCache should be able to save and retrieve an item', () => {
    const cache = BrowserCache();

    expect(cache.has(KEY)).toBe(false);

    cache.set(KEY, VALUE);

    expect(cache.has(KEY)).toBe(true);
    expect(cache.get(KEY)).toBe(VALUE);

    cache.expire(KEY);

    expect(cache.has(KEY)).toBe(false);
    expect(() => cache.get(KEY)).toThrow();

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem).toHaveBeenCalledTimes(6);
});

test('BrowserCache should not be able to get an expired item by the default TTL set to 0', () => {
    const cache = BrowserCache({
        defaultTtl: 0
    });

    expect(cache.has(KEY)).toBe(false);

    cache.set(KEY, VALUE);

    expect(() => cache.get(KEY)).toThrow();
    expect(cache.has(KEY)).toBe(false);

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(0);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.getItem).toHaveBeenCalledTimes(3);
});

test('BrowserCache should not be able to get an expired item by a custom TTL set to 0', () => {
    const cache = BrowserCache();

    expect(cache.has(KEY)).toBe(false);

    cache.set(KEY, VALUE, 0);

    expect(() => cache.get(KEY)).toThrow();
    expect(cache.has(KEY)).toBe(false);

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(0);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.getItem).toHaveBeenCalledTimes(3);
});

test('BrowserCache should not be able to get an expired item', async () => {
    const sec = 1;
    const cache = BrowserCache();

    expect(cache.has(KEY)).toBe(false);

    cache.set(KEY, VALUE, sec);

    expect(cache.get(KEY)).toBe(VALUE);

    expect(cache.has(KEY)).toBe(true);

    await wait(sec * 2);

    expect(() => cache.get(KEY)).toThrow();
    expect(cache.has(KEY)).toBe(false);

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem).toHaveBeenCalledTimes(6);
});

test('BrowserCache should not be able to get an expired item by a periodic check', async () => {
    const sec = 1;
    const cache = BrowserCache({
        checkPeriod: sec / 2,
        defaultTtl: sec
    });

    expect(cache.has(KEY)).toBe(false);

    cache.set(KEY, VALUE);

    expect(cache.get(KEY)).toBe(VALUE);
    expect(cache.has(KEY)).toBe(true);

    await wait(sec * 2);

    expect(() => cache.get(KEY)).toThrow();
    expect(cache.has(KEY)).toBe(false);

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem.mock.calls.length).toBeGreaterThan(5);
});
