import globals from "globals";
import js from "@eslint/js";
import typescriptParser from "@typescript-eslint/parser";
import jsDocPlugin from "eslint-plugin-jsdoc";
import preferArrowPlugin from "eslint-plugin-prefer-arrow";
import tseslint from "typescript-eslint";

/* enable next line to check the configuration*/
// console.log(typescriptPlugin);

/*
Happy linting! 💖
*/
export default [
    // Imported settings from https://repository.rz.raritan.com/gitlab/lap/idm/idm_ts_conf/-/blob/master/index.mjs?ref_type=heads
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        name: "IDM Linter config",
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
            },
            parserOptions: {
                parser: typescriptParser,
                project: true
            }
        },
        plugins: {
            jsDoc: jsDocPlugin,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            preferArrow: preferArrowPlugin,
        },
        rules: {
            "indent": [ "warn", 4, {
                "ignoreComments": true,
                "SwitchCase": 1,
            } ],
            "semi": ["warn", "always"],
            "no-unreachable": "warn",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn", {
                    "argsIgnorePattern": "^_",
                }
            ],
            "require-await": "error",
            "no-cond-assign": [ "error", "except-parens" ],
            "no-constant-condition": [ "error", { "checkLoops": false } ],
            "no-debugger": "warn",
            "@typescript-eslint/no-floating-promises": "off",
            "@typescript-eslint/consistent-type-assertions": [
                "error",
                {
                    "assertionStyle": "never"
                }
            ],
            "@typescript-eslint/no-unnecessary-type-assertion": "error"
        }
    },
    // Custom settings
    {
        ignores: [ ]
    },
    {
        files: [ '*.ts' ]
    },
    {
        rules: {
            "@typescript-eslint/no-misused-promises": [
                "error",
                {
                    "checksVoidReturn": false
                }
            ],
            "@typescript-eslint/require-await": "off",
            "require-await": "off"
        }
    }
];
