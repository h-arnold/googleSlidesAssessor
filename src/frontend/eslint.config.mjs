import globals from "globals";
import pluginJs from "@eslint/js";
import googleappsscript from "eslint-plugin-googleappsscript";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...googleappsscript.environments.googleappsscript.globals,
      },
    },
  },
  pluginJs.configs.recommended,
];
