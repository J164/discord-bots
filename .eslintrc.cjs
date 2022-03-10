module.exports = {
    env: {
        es2021: true,
        node: true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
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
		"unicorn"
    ],
    rules: {
		"complexity": ["warn", 20],
		"eqeqeq": "error",
		"no-invalid-this": "error",
		"no-restricted-globals": [ "error", "process", "setTimeout", "setInterval", "Buffer" ],
		"no-return-await": "error",
		"no-warning-comments": "warn",
		"no-useless-return": "error",
		"no-var": "error",
		"prefer-const": "error",
		"yoda": "error",

		"array-bracket-spacing": ["error", "always"],
		"arrow-spacing": "error",
		"block-spacing": ["error", "always"],
		"brace-style": ["error", "1tbs", { "allowSingleLine": true }],
		"camelcase": "error",
		"comma-dangle": ["error", "always-multiline"],
		"comma-spacing": ["error", { "before": false, "after": true }],
		"new-parens": "error",
		"no-multi-spaces": "error",
		"no-trailing-spaces": "error",
		"quotes": ["error", "single", { "allowTemplateLiterals": true }],
		"semi": [ "error", "never" ],

		"@typescript-eslint/no-misused-promises": [ "error", { "checksVoidReturn": false } ],
		"@typescript-eslint/prefer-readonly": "error",
		"unicorn/consistent-function-scoping": "off",
		"unicorn/no-await-expression-member": "off",
    }
}
