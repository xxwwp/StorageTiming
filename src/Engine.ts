import { DV_STORAGE_KEY, DV_STORAGE_TYPE, PROJECT_NAME } from "./consts";
import { StorageType } from "./modal";
import { isUndefined } from "./utils";

export default class Engine<M> {
  /** 存储 storage 是用的 key 值，Storage.set 的第一个参数 */
  readonly storageKey: string;
  /** Storage 的实例 */
  private storage: Storage;
  /** 当前 Storage 的类型 */
  readonly type: StorageType;

  /** 根据 storageKey 唯一实例化 */
  private static uniqueStorageKey: string[] = [];

  /**
   * @param storageKey 存储 Storage 使用的 key 名
   * @param type Storage 的类型
   */
  constructor({
    storageKey = DV_STORAGE_KEY,
    type = DV_STORAGE_TYPE,
  }: { storageKey?: string; type?: StorageType } = {}) {
    // 唯一实例检查
    if (Engine.uniqueStorageKey.includes(storageKey)) {
      throw new Error(
        `${PROJECT_NAME}: Storagekey "${storageKey}" has been used. An "engineOptions.storageKye" the same storage can only be instantiated once. Please try using a different storageKey.`
      );
    } else Engine.uniqueStorageKey.push(storageKey);

    this.storageKey = storageKey;
    this.storage = window[type];
    this.type = type;
  }

  set(data: M) {
    if (!isUndefined(data)) this.storage.setItem(this.storageKey, JSON.stringify(data));
  }

  get(): unknown {
    try {
      return JSON.parse(this.storage.getItem(this.storageKey) || "null");
    } catch (error) {
      console.error(error);
      console.warn(
        `The "${this.type}" model of key "${this.storageKey}" is corrupt and cannot be resolved using JSON. Use null instead.`
      );
      return null;
    }
  }

  clear() {
    this.storage.removeItem(this.storageKey);
  }
}
