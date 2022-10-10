import fill from 'fill-object';

import CacheItem from './src/interfaces/CacheItem';
import Nullable from './src/interfaces/Nullable';
import Options from './src/interfaces/Options';

import constants from './src/util/constants';

const defaultOptions = { ...constants.defaultOptions, storageEngine: constants.defaultStorageEngine };

export = function (options: Partial<Options> = defaultOptions) {
    const _options = { ...options };
    delete _options['storageEngine'];

    const opt = fill(_options, constants.defaultOptions, true) as Options;

    opt.storageEngine = options.storageEngine || constants.defaultStorageEngine;

    if (opt.checkPeriod !== null && opt.checkPeriod > 0) {
        setInterval(() => {
            for (let i = 0; i < opt.storageEngine.length; i++) {
                const key = opt.storageEngine.key(i)!;
                has(key);
            }
        }, opt.checkPeriod);
    }

    function expire(key: string): void {
        opt.storageEngine.removeItem(key);
    }

    function has(key: string): boolean {
        const item = opt.storageEngine.getItem(key) ?? null;

        // Item does not exist in the opt.storageEngine
        if (item === null) return false;

        let parsed: CacheItem<unknown>;

        try {
            parsed = JSON.parse(item);

            if (typeof parsed !== 'object' || !parsed.hasOwnProperty('value') || !parsed.hasOwnProperty('expiresOn'))
                throw new Error('Invalid item');
        } catch {
            // Item is not a valid JSON string
            return false;
        }

        if (parsed.expiresOn && Number(parsed.expiresOn) < Date.now()) {
            // Item already expired
            expire(key);
            return false;
        }

        // Item exists and is valid
        return true;
    }

    function get<T = unknown>(key: string): T {
        if (!has(key)) throw new Error(`Item with key "${key}" does not exist`);

        const item = opt.storageEngine.getItem(key)!;

        let parsed: CacheItem<T>;

        try {
            parsed = JSON.parse(item);
        } catch {
            throw new Error(`Item with key "${key}" is invalid`);
        }

        return parsed.value;
    }

    function set<T = unknown>(key: string, value: T, ttl: Nullable<number> = opt.defaultTtl): void {
        let expiresOn: Nullable<Date>;

        if (ttl === 0) return;

        if (ttl !== null) {
            expiresOn = new Date();
            expiresOn.setSeconds(expiresOn.getSeconds() + ttl);
        } else {
            expiresOn = null;
        }

        const item: CacheItem<T> = {
            value,
            expiresOn
        };

        opt.storageEngine.setItem(key, JSON.stringify(item));
    }

    return {
        expire,
        has,
        get,
        set
    };
}