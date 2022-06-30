# StorageTiming doc

language: [中文文档][1]

## Introduction

StorageTiming is used to manage localStorage and sessionStorage, and can set timing for them.

## Installation

```shell
npm install --save storage-timing
# or
yarn add storage-timing
```

## Usage

```ts
import { Store } from "storage-timing";

const store = new Store();
const token = store.atom("token");
const foo = store.atom("foo");

token.set({ code: "bar" });
token.get(); // { code: "bar" }

token.remove();
token.get(); // null

// set timing. Expires after one hour, `foo.get()` returns "content" within one hour and null after one hour.
foo.set("content", Date.now() + 3600 * 1000);
```

## Other

Welcome to the community to translate according to the Chinese document

## Quote

- [中文文档][1]

[1]: https://github.com/xxwwp/StorageTiming/blob/main/docs/zh.md
