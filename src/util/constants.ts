import Options from '../interfaces/Options';

export default {
    defaultOptions: {
        checkPeriod: null,
        defaultTtl: 3600,
        storageEngine: localStorage
    } as Options
}