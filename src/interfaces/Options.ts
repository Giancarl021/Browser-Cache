import Nullable from './Nullable';

interface Options {
    defaultTtl: number;
    checkPeriod: Nullable<number>;
    storageEngine: Storage;
}

export default Options;