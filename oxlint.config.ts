import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    suspicious: "off",
    pedantic: "off",
    perf: "off",
    style: "off",
    restriction: "off",
    nursery: "off",
  },

  rules: {
    "eslint/no-unused-vars": "error",
    "unicorn/no-new-array": "warn",
    "unicorn/no-useless-spread": "warn",
    "unicorn/no-useless-length-check": "off",
    "typescript/no-wrapper-object-types": "off",
  },
});
