import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "warn", // once cleaned up, change to "error"
    suspicious: "off", // evaluate after correctness is cleaned up
    pedantic: "off",
    perf: "off",
    style: "off",
    restriction: "off",
    nursery: "off",
  },

  rules: {
    "eslint/no-unused-vars": "warn",

    // Enable later
    "unicorn/no-new-array": "off",
    "unicorn/no-useless-spread": "off",
    "unicorn/no-useless-length-check": "off",
    "typescript/no-wrapper-object-types": "off",
  },
});
