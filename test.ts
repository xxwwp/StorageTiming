import { Store as Store, DV_STORAGE_KEY, PROJECT_NAME } from "./src/main";

function assert(target: any, origin: any, name: string) {
  if (target === origin) {
    console.log(`%c pass: ${name}`, "color:green");
  } else {
    console.log(`%c fail: ${name}`, "color:red");
  }
}

try {
  new Store();
  new Store();
} catch (error: any) {
  assert(
    error.message,
    `${PROJECT_NAME}: Storagekey "${DV_STORAGE_KEY}" has been used. An "engineOptions.storageKye" the same storage can only be instantiated once. Please try using a different storageKey.`,
    "实例唯一性检查1"
  );
}

try {
  new Store({ storageKey: "testkeysession", type: "sessionStorage" });
  new Store({ storageKey: "testkeysession", type: "sessionStorage" });
} catch (error: any) {
  assert(
    error.message,
    `${PROJECT_NAME}: Storagekey "${"testkeysession"}" has been used. An "engineOptions.storageKye" the same storage can only be instantiated once. Please try using a different storageKey.`,
    "实例唯一性检查2"
  );
}

// 原子测试
const st1 = new Store<"one" | "tow" | "three">({
  storageKey: "st1",
});

st1.clear();

assert(st1.atom<number>("one").get(), null, "空值获取");
assert(st1.atom<number>("one").get() ?? 123, 123, "默认值获取");

const st1Tow = st1.atom<string>("tow");
st1Tow.set("tow value");
assert(st1Tow.get(), "tow value", "设置值缓存区非引用值");

const st1Three = st1.atom<{ name: string; id: number }>("three");
const st1ThreeData = { name: "test", id: 1 };
st1Three.set(st1ThreeData);
assert(st1ThreeData, st1Three.get(), "设置缓存区引用值");

const st2 = new Store<"foo" | "bar">({ storageKey: "st2" });

const st2Foo = st2.atom<boolean>("foo");
const st2Bar = st2.atom<{ name: "bar" }>("bar");

assert(st2Foo.get(), true, "获取非引用类型存储数据");
st2Foo.set(true);
assert(st2Bar.get()?.name, "bar", "获取引用类型存储数据");
st2Bar.set({ name: "bar" });

const st3 = new Store<"foo">({ storageKey: "st3" });

const st3Foo = st3.atom<number>("foo");
assert(st3Foo.get(), 1, "获取超时数据，3s 内 reload 应为 pass");
st3Foo.set(1, Date.now() + 3000);

// 版本验证

type ST4Keys = "foo" | "bar" | "baz";
const st4Version = Date.now().toString();
const st4 = new Store<ST4Keys>({
  storageKey: "st4",
  version: st4Version,
  clearTimeout: true,
  onVersionChange(old, retain, oldVersion) {
    assert(!!old.find((v) => v.key === "foo"), true, "版本迭代获取旧数据");
    assert(old.length, 2, "版本迭代过滤旧数据中的超时数据");
    assert(st4Version !== oldVersion, true, "版本号检测");

    old.forEach((atom) => {
      if (atom.key === "baz") {
        retain({ ...atom, key: "baz" });
      }
    });
  },
});

assert(st4.atom("foo").get(), null, "版本迭代过滤未保留的数据");
assert(st4.atom("baz").get(), "baz", "版本迭代获取保留的数据");

st4.atom("foo").set("foo");
st4.atom("bar").set("bar", Date.now());
st4.atom("baz").set("baz");

const st5 = new Store<"foo">({
  storageKey: "st5",
});
const st5Foo = st5.atom<"foo">("foo");
st5Foo.set("foo");
assert(st5Foo.get(), "foo", "clear 清空之前");
st5.clear();
assert(st5Foo.get(), null, "clear 清空之后");

// 删除测试
const st6 = new Store<"foo">({
  storageKey: "st6",
});

st6.setAtom("foo", "foo");
assert(st6.findAtom("foo")?.value, "foo", "remove 删除之前");
st6.removeAtom("foo");
assert(st6.findAtom("foo"), null, "remove 删除之后");

const st6Foo = st6.atom("foo");

st6Foo.remove();
st6Foo.set("value");
assert(st6Foo.get(), "value", "remove 后再次 set 和 get");

// 数据损坏测试

localStorage.setItem("st7", "zxczxc");
console.log(
  "%c下面报错SyntaxError: Unexpected token z in JSON at position 0，并且含有对应的警告是被允许的，这是测试的一部分。",
  "color:silver"
);
const st7 = new Store({ storageKey: "st7" });
assert(st7.atom("foo").get(100), 100, "数据格式损坏获取");
