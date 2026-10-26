// ESLint 扁平配置（v9）
// 目标：拦住「属性写错」「未定义变量」「误用真假值判断」这类静态可查的错，
// 而不是在风格上做无意义的统一。
import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'chunqiu.html',
      '.tmp/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['js/**/*.js', 'test/**/*.mjs', 'build.mjs', 'serve.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        // 浏览器
        window: 'readonly', document: 'readonly', localStorage: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        performance: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly',
        setInterval: 'readonly', clearInterval: 'readonly', console: 'readonly',
        URL: 'readonly', Blob: 'readonly', FileReader: 'readonly',
        HTMLElement: 'readonly', Element: 'readonly', Node: 'readonly',
        MouseEvent: 'readonly', KeyboardEvent: 'readonly', Event: 'readonly',
        DOMParser: 'readonly', Image: 'readonly', alert: 'readonly', navigator: 'readonly',
        // Node（测试与构建脚本）
        process: 'readonly', Buffer: 'readonly', __dirname: 'readonly',
        globalThis: 'readonly',
      },
    },
    rules: {
      // 未定义变量：'merchant' 那类拼写错误所在层
      'no-undef': 'error',
      // 未使用变量：死代码与无效导入
      'no-unused-vars': ['error', {
        args: 'after-used',
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
      }],
      // 真值得警惕的写法
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-fallthrough': 'error',
      'no-self-assign': 'error',
      'no-self-compare': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-prototype-builtins': 'error',
      'no-useless-escape': 'error',
      'no-irregular-whitespace': 'error',
      'no-misleading-character-class': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      // 本项目的关键约定：回放必须可复现
      'no-restricted-syntax': ['error', {
        selector: "MemberExpression[object.name='Math'][property.name='random']",
        message: '游戏逻辑必须用存档内种子随机 R.next(st)，不能用 Math.random。',
      }],
    },
  },
  {
    // serve.cjs 是 CommonJS
    files: ['serve.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { require: 'readonly', module: 'writable', exports: 'writable' },
    },
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // 测试脚本：允许用 Math.random 构造随机走法，允许宽松的未使用变量
    files: ['test/**/*.mjs'],
    rules: {
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],
      'no-restricted-syntax': 'off',
      'no-self-compare': 'off',
    },
  },
];
