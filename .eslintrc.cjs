module.exports = {
    env: {
        es2021: true,
        node: true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"plugin:import/typescript",
		"plugin:unicorn/recommended"
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json']
    },
    plugins: [
        "@typescript-eslint",
		"import",
		"unicorn"
    ],
    rules: {
        "semi": [ "error", "never" ],
		"no-warning-comments": "warn",
		"no-restricted-globals": [ "error", "process", "setTimeout", "setInterval" ],
		"no-case-declarations": "warn",
		"@typescript-eslint/no-var-requires": "warn",
		"import/extensions": [ "error", "ignorePackages" ],
		"import/no-commonjs": "error",
		"no-unsafe-optional-chaining": "error",
		"complexity": ["warn", 15],
		"default-case-last": "error",
		"eqeqeq": "error",
		"no-constructor-return": "error",
		"no-else-return": "error",
		"no-empty-function": "error",
		"no-invalid-this": "error",
		"no-multi-spaces": "error",
		"no-return-await": "error",
		"no-useless-return": "error",
		"yoda": "error",
		"no-shadow": "error",
		"no-use-before-define": "warn",
		"array-bracket-spacing": ["error", "always"],
		"block-spacing": ["error", "always"],
		"brace-style": ["error", "1tbs", { "allowSingleLine": true }],
		"camelcase": "error",
		"comma-spacing": ["error", { "before": false, "after": true }],
		"new-parens": "error",
		"no-trailing-spaces": "error",
		"quotes": ["error", "single", { "allowTemplateLiterals": true }],
		"no-var": "error",
		"prefer-const": "error",
		"unicorn/no-await-expression-member": "off",
		"unicorn/consistent-function-scoping": "off",
		"@typescript-eslint/prefer-readonly": "error",
		"@typescript-eslint/no-misused-promises": [ "error", { "checksVoidReturn": false } ],
		"@typescript-eslint/no-unsafe-assignment": "off"
    }
}
