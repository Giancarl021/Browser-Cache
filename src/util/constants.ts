import Options from '../interfaces/Options';

export default {
    defaultOptions: {
        checkPeriod: null,
        defaultTtl: null,
        keyPrefix: 'browserCache::'
    } as Omit<Options, 'storageEngine'>,
    defaultStorageEngine: localStorage
}