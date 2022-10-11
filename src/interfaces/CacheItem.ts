import Nullable from './Nullable';

interface CacheItem<T> {
    value: T,
    expiresOn: Nullable<Date>
}

export type StoredCacheItem<T> = Omit<CacheItem<T>, 'expiresOn'> & { expiresOn: Nullable<string> };

export type UnparsedCacheItem = CacheItem<unknown> | StoredCacheItem<unknown>;

export default CacheItem;