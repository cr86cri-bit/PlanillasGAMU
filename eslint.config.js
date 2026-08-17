import js from "@eslint/js";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  {
    files: ["*.config.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        process: "readonly",
      },
    },
  },
  {
    files: ["src/**/*.js", "tests/**/*.js", "worker/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        AbortController: "readonly",
        Blob: "readonly",
        CustomEvent: "readonly",
        Deno: "readonly",
        FileReader: "readonly",
        HashChangeEvent: "readonly",
        Headers: "readonly",
        Node: "readonly",
        Response: "readonly",
        TextEncoder: "readonly",
        URL: "readonly",
        atob: "readonly",
        btoa: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        crypto: "readonly",
        document: "readonly",
        fetch: "readonly",
        importScripts: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        postMessage: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        self: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
