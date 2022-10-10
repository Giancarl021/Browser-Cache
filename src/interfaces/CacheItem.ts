import Nullable from './Nullable';

interface CacheItem<T> {
    value: T,
    expiresOn: Nullable<Date>
}

export default CacheItem;