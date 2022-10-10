import Options from '../interfaces/Options';

export default {
    defaultOptions: {
        checkPeriod: null,
        defaultTtl: null
    } as Omit<Options, 'storageEngine'>,
    defaultStorageEngine: localStorage
}