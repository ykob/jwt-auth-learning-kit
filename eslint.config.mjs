import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // 適用したい設定を配列に列挙していく

  // ESLintの推奨設定
  js.configs.recommended,

  // TypeScript-ESLintの推奨設定
  ...tseslint.configs.recommended,

  // Prettierとの競合ルールを無効化する設定（必ず最後に置く）
  prettierConfig,

  // プロジェクト固有のルールや設定
  {
    rules: {},
  },

  // ESLintの対象外にするファイルやディレクトリ
  {
    ignores: ['node_modules/', 'dist/', 'apps/*/dist/', 'packages/*/dist/', '**/*.cjs'],
  }
);
