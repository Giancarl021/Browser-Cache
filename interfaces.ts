import CacheItem from './src/interfaces/CacheItem';
import Options from './src/interfaces/Options';
import LocalCache from './index';

type PartialOptions = Partial<Options>;
type LocalCacheService = typeof LocalCache;
type LocalCacheInstance = (options: PartialOptions) => ReturnType<LocalCacheService>;

export {
    CacheItem as LocalCacheItem,
    Options as LocalCacheOptions,
    PartialOptions as LocalCachePartialOptions,
    LocalCacheService,
    LocalCacheInstance
};