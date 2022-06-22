# StorageTiming doc

language: [中文文档][1]

## Installation

```shell
npm install --save storage-timing
# or
yarn add storage-timing
```

## Usage

```ts
import { Store } from "storage-timing";

const st = new Store();
const token = st.atom("token");

token.set({ code: "bar" });
token.get(); // { code: "bar" }

token.remove();
token.get(); // null
```

## Other

Welcome to the community to translate according to the Chinese document

## Quote

- [中文文档][1]

[1]: ./docs/zh.md
