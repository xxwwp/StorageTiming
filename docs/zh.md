# StorageTiming 中文文档

StorageTiming 库用以解决存放在 localStorage 和 sessionStorage 中的数据，对数据进行归纳，同时提供为数据设置有效时间。并使用 typescript 对数据类型和键值进行定义。

## 安装

使用 npm 进行安装：

```shell
npm install --save storage-timing
```

或者使用 yarn：

```shell
yarn add storage-timing
```

## 概念

原子数据：StorageTiming 存储数据时记录了它的创建时间，更新时间等信息，这组数据信息和数据本身被称为原子数据，类型大致如下：

```ts
type IAtom = {
  key: string | number; // 数据的键
  value: any; // 数据的值
  createAt: number; // 创建数据时的时间戳
  updateAt: number; // 更新数据是的时间戳
  timeout: number; // 数据超时的时间戳，-1 为永不超时
};
```

## 使用

### 一个简单的例子

```ts
import { Store } from "storage-timing";

const st = new Store();
const token = st.atom("token");

token.set({ code: "bar" });
token.get(); // { code: "bar" }

token.remove();
token.get(); // null
```

上面的例子中我们实例化了一个 Store 类，它会返回我们一个可用的存储库，通过方法 `atom` 我们可以对一个特定的数据进行操作。

### 推荐的方式

在 StorageTiming 中使用 typescript 可以对数据进行更加有效的控制，因为 StorageTiming 使用 [辨识联合][1] 对数据进行存储。

但是 StorageTiming 并不需要声明整个辨识联合的类型，那样并不利于数据的迭代。推荐使用一组字符串或者数字联合进行控制：

```ts
type Keys = "token" | "userID";

const st = new Store<Keys>();

const token = st.atom<string>("token");
token.set("foo");

const userID = st.atom<number>("userID");
userID.set(123);
```

如果你不喜欢 typescript 的环境，我们也建议你使用字典对键的名称进行归纳，避免开发时把两个数据作用到同一个键上：

```js
const keys = {
  token: "token",
  userID: "userID",
};

const st = new Store();

const token = st.atom(keys.token);
token.set("foo");

const userID = st.atom(keys.userID);
userID.set(123);
```

### 获取数据

StorageTiming 从本地 Storage 中获取数据来初始化缓存，如果本地 Storage 中没有可以初始化的数据，在访问相关值时一般会获取到 `null` ，例如：

```js
const st = new Store();
const foo = st.atom("foo");
// first run
const fooValue = foo.get(); // null
```

默认值：

在 `atom.get` 访问一个数据时，你可以使用默认参数对其返回值进行填充，例如：

```js
const foo = new Store().atom("foo");
// first run
const fooValue = foo.get(100); // 100
```

### 设置数据

可以直接在一个原子上使用 set 方法来存储数据，默认情况下它将永久保存：

```js
const foo = new Store({ type: "localStorage" }).atom("foo");
foo.set("something"); // Never expire

const fooSession = new Store({ type: "sessionStorage" }).atom("foo");
fooSession.set("something"); // This session will never expire
```

StorageTiming 允许你存储一个数据时设置超时时间，但是你访问一个已经超时的数据时，StorageTiming 会返回 null：

```js
const foo = new Store().atom("foo");

foo.set("something", Date.now() - 1000);
console.log(foo.get()); // null

foo.set("something", Date.now() + 1000);
console.log(foo.get()); // "something"

setTimeout(() => {
  console.log(foo.get()); // null
}, 2000);
```

能否访问一个超时的数据？答案是可以的，但是 StorageTiming 不建议你这么做，超时数据应该被认为是删除了，不应该再次访问。可以使用 atom.getMeta 来访问一个原子的所有信息，就算它已经超时也能够获取：

```js
const foo = new Store().atom("foo");

foo.set("something", Date.now() - 1000);
console.log(foo.getMeta()); // IAtom<"foo",string>
```

上述代码将打印原子 "foo" 的相关信息，数据类型参考 [概念](#概念) 部分。

### 删除数据

每个原子实例提供一个 remove 方法对数据进行删除：

```js
const atom = new Store().atom("key");

atom.remove();
```

### 数据版本迭代

当需要对 localStorage 或 sessionStorage 中的数据进行结构或者意义调整时，并且依赖于旧版本的数据时，可能用到该功能。

例如两个版本同一原子的数据格式不同时：

```js
// last version
const foo = new Store().atom("foo");
foo.set({ name: "foo" });

// next version
const foo = new Store().atom("foo");
foo.get(); // { name: "foo" } !!! Wrong data type !!!
```

如果不修改版本号，那么 `foo.get` 在下一个版本获取到的数据格式就会错误。此时我们应该为 Store 设置版本号：

```js
// last version
const foo = new Store({ version: "v1" }).atom("foo");
foo.set({ name: "foo" });

// next version
const foo = new Store({ version: "v2" }).atom("foo");
foo.get(); // null
```

StorageTiming 每次初始化都会检查 Storage 中的版本号和当前的版本号是否一致，如果不一致，默认就会删除所有的旧数据。

### 保留旧版本的数据

可以通过回调 `onVersionChange` 在监听版本的迭代，并在迭代时保留需要的旧数据：

```js
const st = new Store({
  version: "next_version",
  onVersionChange(old, save) {
    const foo = old.find((item) => item.key === "foo");
    foo && save({ ...foo, key: "foo" });

    const bar = old.find((item) => item.key === "bar");
    bar && save({ ...bar, key: "bar" });
  },
});

st.atom("foo").get(); // Data from the last version.
```

### 多应用 & 唯一实例

也许一个项目会有多个应用，它们使用到的 key 类似甚至相同，StorageTiming 使用唯一实例的方式来解决这个问题。首先，相同 storageKey 的 Store 无法实例化两次：

```js
new Store();
new Store(); // error

new Store({ storageKey: "app" });
new Store({ storageKey: "app" }); // error
```

构造 Store 时可以传递 storageKey 参数，它被用于标记当前的实例，同时作用于本地存储的 key 值。多个应用可以按以下方式获取 Store：

```js
const store1 = new Store({ storageKey: "app1" });
const store2 = new Store({ storageKey: "app2" });

store1.atom("unique").set(1);
store1.atom("unique").get(); // 1

store2.atom("unique").get(); // null
```

不同 storageKey 的 Store 实例互不干扰。

> Store 并没有使用类似单例类的方式根据 storageKey 返回唯一实例，而是直接抛出错误，这能有效的提醒开发者使用了重复的同一 Store。

### typescript

StorageTiming 对数据键和原子数据的值类型都有相关的类型支持，使用 typescript 可以轻易设置相关方法或数据的类型：

```ts
import { Store } from "storage-timing";

type Keys =
  /** comment */
  | "token"
  /** comment */
  | "userID"
  /** comment */
  | "obj";

const store = new Store<Keys>();

const token = store.atom<string>("token");
const userID = store.atom<number>("userID");
const obj = store.atom<{ name: string }>("obj");
```

## api

StorageTiming 没有默认的导出，它使用具名导出所需的 api，导出的模块含有以下属性（以下只包含你可能会使用到的属性或类型）：

- Store：一个构造函数，使用 `new` 关键字进行实例化。

- NEVER_TIME_OUT：数据永不超时的字面量。

- IAtom：类型导出，一个原子的类型。

- StorageModal：类型导出，存储在 Storage 中的数据模型。

- ModalUtils：一个静态类，包含了一些对数据模型进行控制的工具。

### Store 类

Store 类用以初始化一个 Storage 存储器，它将用于初始化你的 Storage 环境。

Store 有一个类型参数：

```ts
type Key = number | string;
class StorageTiming<K extends Key = Key> {
  /*...*/
}
```

泛型 `K` 应是一个联合，用来约束存储数据的辨识联合列表。

**constructor：**

构造 Store 时可以传递以下参数：

- storageKey：用于设置整个 StorageTiming 存储时使用到的 key，如果你有多个应用时可以使用。**相同 storageKey 的实例不能构造两次。**

  - 类型：`string`。
  - 默认值：StorageTiming.DV_STORAGE_KEY。

- version：用于设置 Storage 的版本号，它在你的 Storage 结构类型或者数据意义发生改变时很有效。如果你需要更新 Storage 中的数据类型或者其意义，当设置版本号和本地环境中的版本号不一致是，Store 类会触发回调 onVersionChange。

  - 类型：`string`。
  - 默认值：StorageTiming.DV_STORAGE_VERSION。

- type：用于设置驱动 StorageTiming 的 Storage 类型，是 localStorage 还是 sessionStorage。

  - 类型：`"localStorage" | "sessionStorage"`
  - 默认值：StorageTiming.DV_STORAGE_TYPE （`"localStorage"`）

- onVersionChange：版本迭代的回调，当 Store 实例化的版本和本地存储的版本不一致时执行。

  - 类型：`(old: IAtom[], save: (atom: IAtom<K, any>) => void, oldVersion: string): void`，其中 K 是 Store 用于辨识的联合。
  - 参数：
    1. old：旧版本的数据列表
    1. save：用以保存数据的函数，参数为一个原子数据
    1. oldVersion：旧的版本号

- clearTimeout：是否在实例化时清理已经过时的数据，清理数据的操作发生在版本回调 onVersionChange 的前面。

  - 类型：`boolean`
  - 默认值：false

  Store 默认不会删除已经过时的数据。

用例：

```js
import { Store } from "storage-timing";
new Store({
  version: "v1.0.1",
  storageKey: "app_name",
  type: "localStorage",
  onVersionChange(old, save, oldVersion) {},
  clearTimeout: false,
});
```

**属性和方法：**

**虽然 Store 类内置很多属性，但是都不建议用户使用，可以理解为提供的属性数量为 0。**

方法：

- findAtom：通过键值查询一个原子数据。

  - 类型：`findAtom<D = any>(key: K): IAtom<K, D> | null`
  - 参数：
    - key：数据的键
  - 返回值：返回数据副本，为空时返回 null。**与是否过期无关**。

- setAtom：存储一个值。

  - 类型：`setAtom<D = any>(key: K, value: D, timeout = NEVER_TIME_OUT):void`
  - 参数：
    - key：数据的键。
    - value：目标值。
    - timeout：超时时间，默认永不超时。

- removeAtom：删除一个原子数据。

  - 类型：`removeAtom(key: K): void`
  - 参数：
    - key：数据的键。

- **atom：根据 key 获取一个 Atom 类的实例。**

  - 类型：`atom<D = any>(key: K): Atom<K, D>`
  - 参数：
    - key：数据的键名。
  - 返回值：一个实例化的 [Atom](#Atom) 类。

- getAtoms：获取所有原子数据。

  - 类型：`getAtoms(): IAtom<K, any>[]`
  - 返回值：返回所有原子数据的副本。

- clear：清空数据。

- clearTimeout：删除超时的数据。

- info：返回当前 Store 的相关信息

  - 类型：`info(): { storageKey: string; version: string }`
  - 返回值：
    - 属性：
      - storageKey：Store 存储在本地的 key 值。
      - version：Store 的版本号。

### Atom

**这个类实现对某一个原子数据的控制，它的实例由 Store 类的 atom 方法的返回。**

它有两个类型参数，原子的键类型和存储的值类型：

```ts
type key = number | string;
class Atom<K extends Key, D = any> {
  /* ... */
}
```

可以在使用 `store.atom<D>` 时设置泛型 `D`。

**方法：**

- getMeta：数据的相关信息。

  - 类型：`getMeta(): IAtom<Key, D> | null`
  - 返回值：一个原子数据的副本，为空时返回 null。**与是否过期无关**。

- get：获取数据的值。

  - 类型：`get(): D | null; get(def: D): D;`。
  - 返回值：数据值，**为空或者过期时** 返回 null。

- set：设置一个原子数据的值。

  - 类型：`set(value: D, timeout?: number):void`
  - 参数：
    - value：数据值
    - timeout：超时时间，**默认为永久**。

- remove：删除原子数据的存储。

用例：

```js
const store = new Store({ storageKey: "storetest", version: "10010" });

const fooAtom = store.atom("foo");
const barAtom = store.atom("bar");

fooAtom.set(100);
barAtom.set({ name: "something" }, Date.now() + 30 * 24 * 3600 * 1000); // Expires 30 days

fooAtom.get(); // 100
fooAtom.remove();
fooAtom.get(); // null
```

### ModalUtils

一个静态类，包含一些处理数据的方法。

**方法：**

- isForever：是否是一个永久时间

  - 类型：`static isForever(time: number): boolean`
  - 参数：
    - time：需要判断的时间值

- isTimeout：是否超时
  - 类型：`static isTimeout(timeout: number): boolean`
  - 参数：
    - timeout：需要反对的时间值

## 引用

- [discriminated-unions][1]

- [1]: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions
