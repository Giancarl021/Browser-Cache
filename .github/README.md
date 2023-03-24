# Browser-Cache

![logo](assets/logo.png)

Simple caching service for frontend applications.
## Similar projects

* [TinyCache](https://www.npmjs.com/package/tinycache) - In-memory cache service;

* [Node-Cache](https://www.npmjs.com/package/node-cache) - For NodeJS, but works with polyfills.

## Why?

This package aims to provide a simple cache service with expiration time for browser applications, utilizing the [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage) to store the data.

This allows for a simple caching service that can be used in any browser application, without the need to install any additional dependencies, but, if needed, can be extended to use a different implementation of the default `localStorage` and `sessionStorage`.

## Installation

You can get this package on [NPM](https://www.npmjs.com/package/@giancarl021/browser-cache).

## Usage

### Importing

CommonJS:
```js
const BrowserCache = require('@giancarl021/browser-cache');
```

ES Modules:
```js
import BrowserCache from '@giancarl021/browser-cache';
```

### Initialization

The imported `BrowserCache` function is used to create a new instance of the cache service. It accepts an `options` parameter.

```js
const cache = BrowserCache(options);
```

The `options` parameter is a `Partial<...>` with the following properties:

```ts
interface BrowserCacheOptions {
    defaultTtl: number | null;
    checkPeriod: number | null;
    storageEngine: Storage;
}
```

* `defaultTtl`: The default time-to-live in **seconds** for the cached items. If `null`, the items will never expire. If `0`, no items will be saved. Defaults to `null`.

* `checkPeriod`: The time in **seconds** between each check for expired items. If `null` or `<= 0`, the check will be performed only when the `get` or `has` method is called in that specific item. Defaults to `null`.

* `storageEngine`: The storage engine to use, implementation of the `Storage` API. Defaults to `localStorage`.

### Methods

* `set`: Sets a new item in the cache.
    * `key (string)`: The key of the item;
    * `value (T)`: The value of the item;
    * `ttl (number | null)`: The time-to-live of the item in **seconds**. Defaults to `options.defaultTtl`;
    * [*Typescript only*] `T (unknown)`: The type of the item to be set, defaults to `unknown`.

    Signature:

    ```ts
    function set<T = unknown>(key: string, value: T, ttl?: number | null): void;
    ```

* `get`: Gets an item from the cache. Will throw an error if the item does not exist.
    * `key (string)`: The key of the item;
    * [*Typescript only*] `T (unknown)`: The type of the item to be retrieved, defaults to `unknown`.

    Signature:

    ```ts
    function get<T = unknown>(key: string): T
    ```

* `has`: Checks if an item exists in the cache.
    * `key (string)`: The key of the item;

    Signature:

    ```ts
    function has(key: string): boolean
    ```

* `expire`: Immediately expires an item in the cache.
    * `key (string)`: The key of the item;

    Signature:

    ```ts
    function expire(key: string): void
    ```