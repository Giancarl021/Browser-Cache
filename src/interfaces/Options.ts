import Nullable from './Nullable';

interface Options {
    defaultTtl: Nullable<number>;
    checkPeriod: Nullable<number>;
    storageEngine: Storage;
}

export default Options;