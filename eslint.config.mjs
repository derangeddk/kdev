import globals from "globals";
import pluginJs from "@eslint/js";

export default [
    pluginJs.configs.recommended,
    {
        languageOptions: {
            globals: {
              ...globals.node,
              // add zx globals
              '$': false,
              echo: false,
              chalk: false,
              YAML: false,
              fs: false,
              question: false,
              sleep: false,
            }
        }
    },
];
