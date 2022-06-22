import { NEVER_TIME_OUT } from "./consts";
import { isNumber, isObject, isString } from "./utils";

export type StorageType = "localStorage" | "sessionStorage";

export type Key = number | string;

export type IAtom<K extends Key = Key, V = any> = {
  key: K;
  value: V;
  createAt: number;
  updateAt: number;
  timeout: number;
};

export type IAtomMini<K extends Key, V = any> = {
  k: K;
  v: V;
  cr: number;
  up: number;
  t: number;
};

export type StorageModalMini<K extends Key = Key> = {
  version: string;
  atoms: IAtomMini<K, any>[];
};

/** 存储在 Storage 中的数据模型 */
export type StorageModal<K extends Key = Key> = {
  version: string;
  atoms: IAtom<K, any>[];
};

/** 模型工具类，包含对模型进行控制的静态方法 */
export class ModalUtils {
  static compress<K extends Key = Key>(atom: IAtom<K>): IAtomMini<K> {
    return { k: atom.key, v: atom.value, cr: atom.createAt, up: atom.updateAt, t: atom.timeout };
  }
  static decompression<K extends Key = Key>(atom: IAtomMini<K>): IAtom<K> {
    return { key: atom.k, value: atom.v, createAt: atom.cr, updateAt: atom.up, timeout: atom.t };
  }

  /** 是否是一个永久时间 */
  static isForever(time: number): boolean {
    return time === NEVER_TIME_OUT;
  }

  /** 是否超时 */
  static isTimeout(timeout: number): boolean {
    return !ModalUtils.isForever(timeout) && Date.now() > timeout;
  }

  /** 模型数据检查 */
  static StorageModalMiniCheck(m: unknown): m is StorageModalMini {
    if (!isObject(m)) return false;

    if (!isString(m.version)) return false;

    if (!Array.isArray(m.atoms)) return false;

    return m.atoms.some((a) => {
      const key = isString(a.k) || isNumber(a.k);
      const createAt = isNumber(a.cr);
      const updateAt = isNumber(a.up);
      const timeout = isNumber(a.t);

      return key && createAt && updateAt && timeout;
    });
  }
}
