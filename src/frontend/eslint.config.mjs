import globals from "globals";
import pluginJs from "@eslint/js";
import googleappsscript from "eslint-plugin-googleappsscript";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["src/frontend/slidesAssessor/*.js", "src/frontend/slidesAssessor/**/*.gs"], // Just linting the SlidesAssessor code for now.
    languageOptions: {
      ecmaVersion: 2020, // Use ECMAScript 2020
      sourceType: "module", // Enable module syntax
      globals: {
        ...globals.browser,
        ...globals.node,
        ...googleappsscript.environments.googleappsscript.globals, // Include Google Apps Script globals
      },
    },
    env: {
      browser: true,
      node: true,
      "googleappsscript/googleappsscript": true, // Enable Google Apps Script environment
    },
    plugins: ["googleappsscript"], // Use the Google Apps Script plugin
  },
  pluginJs.configs.recommended, // Apply recommended JavaScript rules
];
