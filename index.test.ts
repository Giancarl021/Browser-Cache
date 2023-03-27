import { test, expect, jest, beforeEach } from '@jest/globals';

import BrowserCache from './index';
import constants from './src/util/constants';

const KEY = 'foo';
const VALUE = 'bar';
const SEC = 1;

const parseLocalStorageItem =
    (localStorage: Storage, keyPrefix: string) =>
    <T>(key: string): T =>
        JSON.parse(localStorage.getItem(keyPrefix + key) || 'null')?.value ??
        null;

const wait = (SEConds: number) =>
    new Promise((resolve) => setTimeout(resolve, SEConds * 1000));

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

    cache.close();
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

    cache.close();
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

    cache.close();
});

test('BrowserCache should not be able to get an expired item', async () => {
    const cache = BrowserCache();

    expect(cache.has(KEY)).toBe(false);

    cache.set(KEY, VALUE, SEC);

    expect(cache.get(KEY)).toBe(VALUE);
    expect(cache.has(KEY)).toBe(true);

    await wait(SEC * 2);

    expect(() => cache.get(KEY)).toThrow();
    expect(cache.has(KEY)).toBe(false);

    expect(spy.getItem).toHaveBeenCalledTimes(6);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    cache.close();
});

test('BrowserCache.has should call Engine only once per check', async () => {
    const cache = BrowserCache();

    cache.has(KEY);

    expect(spy.getItem).toHaveBeenCalledTimes(1);

    cache.set(KEY, VALUE);
    cache.has(KEY);

    expect(spy.getItem).toHaveBeenCalledTimes(2);

    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    cache.close();
});

test('BrowserCache.set should call Engine only once per set', async () => {
    const cache = BrowserCache();

    cache.set(KEY, VALUE);
    expect(spy.setItem).toHaveBeenCalledTimes(1);

    cache.set(KEY, VALUE);
    expect(spy.setItem).toHaveBeenCalledTimes(2);

    expect(spy.getItem).toHaveBeenCalledTimes(0);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    cache.close();
});

test('BrowserCache.expire should call Engine only once per removal', async () => {
    const cache = BrowserCache();

    cache.expire(KEY);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);

    cache.set(KEY, VALUE);
    cache.expire(KEY);

    expect(spy.removeItem).toHaveBeenCalledTimes(2);

    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem).toHaveBeenCalledTimes(0);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    cache.close();
});

test('BrowserCache.get should call Engine only once when item does not exist', async () => {
    const cache = BrowserCache();

    expect(() => cache.get(KEY)).toThrow();
    expect(spy.getItem).toHaveBeenCalledTimes(1);

    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(0);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    cache.close();
});

test('BrowserCache.get should call Engine only twice when item does exist', async () => {
    const cache = BrowserCache();

    cache.set(KEY, VALUE);

    expect(cache.get(KEY)).toBe(VALUE);

    expect(spy.getItem).toHaveBeenCalledTimes(2);

    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    cache.close();
});

test('BrowserCache.close should clear the cache items', async () => {
    const cache = BrowserCache();
    const parse = parseLocalStorageItem(
        localStorage,
        constants.defaultOptions.keyPrefix
    );

    cache.set(KEY, VALUE);

    expect(cache.get(KEY)).toBe(VALUE);
    expect(cache.has(KEY)).toBe(true);

    expect(spy.getItem).toHaveBeenCalledTimes(3);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    cache.close();

    expect(cache.has(KEY)).toBe(false);
    expect(() => cache.get(KEY)).toThrow();
    expect(parse(KEY)).toBeNull();

    expect(spy.getItem).toHaveBeenCalledTimes(6);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.clear).toHaveBeenCalledTimes(0);
});

test('BrowserCache.close should clear the cache items without affecting another values', async () => {
    const cache = BrowserCache();
    const ANOTHER_KEY = 'another-key';
    const parse = parseLocalStorageItem(
        localStorage,
        constants.defaultOptions.keyPrefix
    );

    localStorage.setItem(ANOTHER_KEY, VALUE);

    cache.set(KEY, VALUE);

    expect(cache.get(KEY)).toBe(VALUE);
    expect(cache.has(KEY)).toBe(true);

    expect(() => cache.get(ANOTHER_KEY)).toThrow();
    expect(cache.has(ANOTHER_KEY)).toBe(false);

    expect(spy.getItem).toHaveBeenCalledTimes(5);
    expect(spy.setItem).toHaveBeenCalledTimes(2);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    cache.close();

    expect(cache.has(KEY)).toBe(false);
    expect(() => cache.get(KEY)).toThrow();
    expect(parse(KEY)).toBeNull();

    expect(localStorage.getItem(ANOTHER_KEY)).toBe(VALUE);
    expect(() => cache.get(ANOTHER_KEY)).toThrow();
    expect(cache.has(ANOTHER_KEY)).toBe(false);

    expect(spy.getItem).toHaveBeenCalledTimes(11);
    expect(spy.setItem).toHaveBeenCalledTimes(2);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.clear).toHaveBeenCalledTimes(0);
});

test('BrowserCache should remove an item expired by periodic check without getting it', async () => {
    const cache = BrowserCache({
        checkPeriod: 2 * SEC,
        defaultTtl: SEC
    });
    const parse = parseLocalStorageItem(
        localStorage,
        constants.defaultOptions.keyPrefix
    );

    expect(cache.has(KEY)).toBe(false);

    cache.set(KEY, VALUE);

    expect(cache.has(KEY)).toBe(true);
    expect(cache.get(KEY)).toBe(VALUE);

    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem).toHaveBeenCalledTimes(4);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    await wait(SEC * 2);

    expect(parse(KEY)).toBe(null);
    expect(cache.has(KEY)).toBe(false);
    expect(() => cache.get(KEY)).toThrow();

    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem.mock.calls.length).toBeGreaterThan(6);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    cache.close();
});

test('BrowserCache should not remove an expired item expired without checking it', async () => {
    const cache = BrowserCache({
        defaultTtl: 2 * SEC
    });
    const parse = parseLocalStorageItem(
        localStorage,
        constants.defaultOptions.keyPrefix
    );

    expect(cache.has(KEY)).toBe(false);

    cache.set(KEY, VALUE);

    expect(cache.has(KEY)).toBe(true);
    expect(cache.get(KEY)).toBe(VALUE);
    expect(parse(KEY)).toBe(VALUE);

    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem).toHaveBeenCalledTimes(5);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    await wait(SEC * 2);

    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem).toHaveBeenCalledTimes(5);
    expect(spy.removeItem).toHaveBeenCalledTimes(0);
    expect(spy.clear).toHaveBeenCalledTimes(0);

    expect(parse(KEY)).toBe(VALUE);
    expect(cache.has(KEY)).toBe(false);
    expect(() => cache.get(KEY)).toThrow();

    cache.close();
});

test('BrowserCache should not be able to get an expired item by a periodic check', async () => {
    const cache = BrowserCache({
        checkPeriod: 2 * SEC,
        defaultTtl: SEC
    });
    const parse = parseLocalStorageItem(
        localStorage,
        constants.defaultOptions.keyPrefix
    );

    expect(cache.has(KEY)).toBe(false);

    cache.set(KEY, VALUE);

    expect(cache.get(KEY)).toBe(VALUE);
    expect(cache.has(KEY)).toBe(true);
    expect(parse(KEY)).toBe(VALUE);

    expect(spy.setItem).toBeCalledTimes(1);
    expect(spy.getItem).toBeCalledTimes(5);

    await wait(SEC * 2);

    expect(parse(KEY)).toBeNull();
    expect(() => cache.get(KEY)).toThrow();
    expect(cache.has(KEY)).toBe(false);

    expect(spy.clear).toHaveBeenCalledTimes(0);
    expect(spy.setItem).toHaveBeenCalledTimes(1);
    expect(spy.removeItem).toHaveBeenCalledTimes(1);
    expect(spy.getItem.mock.calls.length).toBeGreaterThan(8);

    cache.close();
});
