import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    suspicious: "warn", // once cleaned up, change to "error"
    pedantic: "off", // set to warn after suspicious is cleaned up
    perf: "off", // set to warn after suspicious is cleaned up
    style: "off",
    restriction: "off",
    nursery: "off",
  },

  rules: {
    "eslint/no-unused-vars": "error",
    "unicorn/no-new-array": "error",
    "unicorn/no-useless-spread": "error",

    "unicorn/no-useless-length-check": "off",
    "typescript/no-wrapper-object-types": "off",
  },
});
