module.exports = {
  root: true, // この設定ファイルをルートとし、親ディレクトリの設定を探さない
  parser: '@typescript-eslint/parser', // TypeScriptを解析するパーサー
  plugins: [
    '@typescript-eslint', // TypeScript用のルールプラグイン
  ],
  extends: [
    'eslint:recommended', // ESLintが推奨する基本的なルール
    'plugin:@typescript-eslint/recommended', // TypeScriptの推奨ルール
    'prettier', // ★ Prettierとの競合ルールを無効化（必ず最後に置く）
  ],
  env: {
    node: true, // Node.jsのグローバル変数（requireなど）を認識させる
    es2021: true, // ES2021の構文を認識させる
  },
  rules: {
    // ここにプロジェクト固有のルールを追加できます
    // 例: '@typescript-eslint/no-explicit-any': 'warn', // any型を警告にする
  },
  ignorePatterns: ['node_modules', 'dist', '**/*.js'], // ESLintの対象外にするファイル/ディレクトリ
};
