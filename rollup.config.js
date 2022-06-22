import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import { uglify } from "rollup-plugin-uglify";

const config = () => {
  return [
    {
      input: "src/main.ts",
      output: [
        {
          file: `lib/index.js`,
          format: "cjs",
          exports: "auto",
        },
        {
          file: `lib/index.umd.min.js`,
          format: "umd",
          name: "StorageTiming",
          plugins: [uglify()],
        },
      ],
      plugins: [typescript({ tsconfig: "./tsconfig.json" })],
    },
    {
      input: `lib/types/main.d.ts`,
      output: [{ file: `lib/index.d.ts`, format: "esm" }],
      plugins: [dts()],
    },
  ];
};

export default config;
