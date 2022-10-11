import CacheItem from './src/interfaces/CacheItem';
import Options from './src/interfaces/Options';
import BrowserCache from './index';

type PartialOptions = Partial<Options>;
type BrowserCacheService = typeof BrowserCache;
type BrowserCacheInstance = (options: PartialOptions) => ReturnType<BrowserCacheService>;

export {
    CacheItem as BrowserCacheItem,
    Options as BrowserCacheOptions,
    PartialOptions as BrowserCachePartialOptions,
    BrowserCacheService,
    BrowserCacheInstance
};