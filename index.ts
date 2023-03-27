import fill from 'fill-object';

import CacheItem, {
    StoredCacheItem,
    UnparsedCacheItem
} from './src/interfaces/CacheItem';
import Nullable from './src/interfaces/Nullable';
import Options from './src/interfaces/Options';

import constants from './src/util/constants';

const defaultOptions: Options = {
    ...constants.defaultOptions,
    storageEngine: constants.defaultStorageEngine
};

export = function (options: Partial<Options> = defaultOptions) {
    const _options = { ...options };
    delete _options['storageEngine'];
    let checkInterval: NodeJS.Timer;

    const opt = fill(_options, constants.defaultOptions, true) as Options;

    opt.storageEngine = options.storageEngine || constants.defaultStorageEngine;

    if (opt.checkPeriod !== null && opt.checkPeriod > 0) {
        checkInterval = setInterval(_fullCheck, opt.checkPeriod * 1000);
    }

    function _fullCheck(clear: boolean = false) {
        const fn = clear ? _expire : _has;

        for (let i = 0; i < opt.storageEngine.length; i++) {
            const key = opt.storageEngine.key(i)!;
            if (key.startsWith(opt.keyPrefix)) fn(key);
        }
    }

    function _getContextKey(key: string) {
        return opt.keyPrefix + key;
    }

    function _expire(contextKey: string) {
        opt.storageEngine.removeItem(contextKey);
    }

    function _has(contextKey: string) {
        const item = opt.storageEngine.getItem(contextKey) ?? null;

        // Item does not exist in the opt.storageEngine
        if (item === null) return false;

        let parsed: UnparsedCacheItem;

        try {
            parsed = JSON.parse(item) as UnparsedCacheItem;

            if (
                typeof parsed !== 'object' ||
                !parsed.hasOwnProperty('value') ||
                !parsed.hasOwnProperty('expiresOn')
            )
                throw new Error('Invalid item');

            parsed.expiresOn =
                typeof parsed.expiresOn === 'string'
                    ? new Date(parsed.expiresOn)
                    : null;
        } catch {
            // Item is not a valid JSON string
            return false;
        }

        if (parsed.expiresOn && Number(parsed.expiresOn) < Date.now()) {
            // Item already expired
            expire(contextKey);
            return false;
        }

        // Item exists and is valid
        return true;
    }

    function expire(key: string): void {
        const _key = _getContextKey(key);
        _expire(_key);
    }

    function has(key: string): boolean {
        const _key = _getContextKey(key);
        return _has(_key);
    }

    function get<T = unknown>(key: string): T {
        const _key = _getContextKey(key);

        if (!_has(_key))
            throw new Error(`Item with key "${key}" does not exist`);

        const item = opt.storageEngine.getItem(_key)!;

        let parsed: StoredCacheItem<T>;

        try {
            parsed = JSON.parse(item);
        } catch {
            throw new Error(`Item with key "${key}" is invalid`);
        }

        return parsed.value;
    }

    function set<T = unknown>(
        key: string,
        value: T,
        ttl: Nullable<number> = opt.defaultTtl
    ): void {
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

        const serializedItem: StoredCacheItem<T> = {
            value,
            expiresOn: item.expiresOn?.toISOString() ?? null
        };

        const serializedString = JSON.stringify(serializedItem) as string;

        const _key = _getContextKey(key);

        opt.storageEngine.setItem(_key, serializedString);
    }

    function close() {
        clearInterval(checkInterval);
        _fullCheck(true);
    }

    return {
        expire,
        has,
        get,
        set,
        close
    };
};
