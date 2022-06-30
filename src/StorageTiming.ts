import { DV_STORAGE_KEY, DV_STORAGE_TYPE, DV_STORAGE_VERSION, NEVER_TIME_OUT } from "./consts";
import Engine from "./Engine";
import { IAtom, IAtomMini, Key, ModalUtils, StorageModal, StorageModalMini, StorageType } from "./modal";
import { isNull, isUndefined } from "./utils";

class Atom<K extends Key, D = any> {
  private st: StorageTiming;
  private key: K;

  constructor({ st, key }: { st: StorageTiming; key: K }) {
    this.st = st;
    this.key = key;
  }

  /** 获取原子数据本身，无论是否过期 */
  getMeta(): IAtom<Key, D> | null {
    return this.st.findAtom<D>(this.key);
  }

  get(): D | null;
  get(def: D): D;

  get(def?: D) {
    const defNull = isUndefined(def) ? null : def;
    const meta = this.st.findAtom<D>(this.key);

    if (isNull(meta)) return defNull;
    else return ModalUtils.isTimeout(meta.timeout) ? defNull : meta.value;
  }

  set(value: D, timeout?: number): void {
    this.st.setAtom(this.key, value, timeout);
  }

  remove() {
    this.st.removeAtom(this.key);
  }
}

export interface OnVersionChange<K extends Key = Key> {
  (old: IAtom[], keep: (atom: IAtom<K, any>) => void, oldVersion: string): void;
}

export class StorageTiming<K extends Key = Key> {
  modal: StorageModal<K>;
  private version: string;
  private storageKey: string;
  private engine: Engine<StorageModalMini<K>>;
  private onVersionChange?: OnVersionChange<K>;

  constructor({
    version = DV_STORAGE_VERSION,
    storageKey = DV_STORAGE_KEY,
    type = DV_STORAGE_TYPE,
    onVersionChange,
    clearTimeout = false,
  }: {
    storageKey?: string;
    version?: string;
    onVersionChange?: OnVersionChange<K>;
    type?: StorageType;
    clearTimeout?: boolean;
  } = {}) {
    this.version = version;
    this.storageKey = storageKey;
    this.engine = new Engine({ storageKey, type });

    this.modal = this.initModal(this.engine.get());
    clearTimeout && this.clearTimeout();

    this.onVersionChange = onVersionChange;
    this.versionCheck();
  }

  /** 初始化模型 */
  private initModal(data: unknown): StorageModal<K> {
    if (ModalUtils.StorageModalMiniCheck(data)) {
      return {
        version: data.version,
        atoms: data.atoms.map((item) => ModalUtils.decompression<K>(item as IAtomMini<K>)),
      };
    } else return { version: this.version, atoms: [] };
  }

  /** 版本检查 */
  private versionCheck() {
    if (this.version === this.modal.version) return;
    const oldVersion = this.modal.version;
    this.modal.version = this.version;
    const newAtoms: IAtom<K, any>[] = [];
    this.onVersionChange?.(
      this.getAtoms(),
      (atom) => {
        const index = newAtoms.findIndex((item) => item.key === atom.key);

        if (index === -1) {
          newAtoms.push(atom);
        } else {
          newAtoms.splice(index, 1, atom);
        }
      },
      oldVersion
    ) ?? [];
    this.modal.atoms = newAtoms;
    this.save();
  }

  /** 保存到 Storage */
  private save() {
    this.engine.set({ version: this.version, atoms: this.modal.atoms.map(ModalUtils.compress) });
  }

  /** 根据 atom.key 查找所在 modal.atoms 中的 index */
  private index(key: K) {
    return this.modal.atoms.findIndex((a) => a.key === key);
  }

  /** 查找一个 atom */
  findAtom<D = any>(key: K): IAtom<K, D> | null {
    const index = this.index(key);
    return index === -1 ? null : { ...this.modal.atoms[index] };
  }

  /** 设置一个 atom */
  setAtom<D = any>(key: K, value: D, timeout = NEVER_TIME_OUT): void {
    const index = this.index(key);
    const now = Date.now();

    if (index === -1) {
      this.modal.atoms.push({ key, value, createAt: now, updateAt: now, timeout });
    } else {
      const atom = this.modal.atoms[index];
      this.modal.atoms.splice(index, 1, { key, value, createAt: atom.createAt, updateAt: now, timeout });
    }

    this.save();
  }

  /** 删除一个 atom */
  removeAtom(key: K): void {
    const index = this.index(key);
    if (index !== -1) {
      this.modal.atoms.splice(index, 1);
      this.save();
    }
  }

  atom<D = any>(key: K): Atom<K, D> {
    return new Atom<K, D>({ st: this, key });
  }

  getAtoms(): IAtom<K, any>[] {
    return this.modal.atoms.map((item) => ({ ...item }));
  }

  /** 清空数据，包括 Storage */
  clear() {
    this.modal.atoms = [];
    this.engine.clear();
  }

  /** 清理超时数据 */
  clearTimeout() {
    this.modal.atoms = this.modal.atoms.filter((atom) => !ModalUtils.isTimeout(atom.timeout));
    this.save();
  }

  info(): { storageKey: string; version: string } {
    return {
      storageKey: this.storageKey,
      version: this.version,
    };
  }
}
