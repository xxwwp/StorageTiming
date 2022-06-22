import { StorageType } from "./modal";

export const PROJECT_NAME = "StorageTiming";

/** 永不超时 */
export const NEVER_TIME_OUT = -1;

/** 默认值：默认 storage 使用的 key */
export const DV_STORAGE_KEY = "STORAGE_TIMING";

/** 默认值：默认 storage 使用的类型 */
export const DV_STORAGE_TYPE: StorageType = "localStorage";

/** 默认值：默认 storage 的版本 */
export const DV_STORAGE_VERSION: string = "1.0.0";
