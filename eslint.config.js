import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// Performance Foundation Spec § 4.2 enforcement: raw <img> tags routinely
// ship without explicit width/height, lazy loading, or Supabase Storage
// transforms — the exact failure mode that produced the Phase 2A bandwidth
// regressions. Use <OptimizedImage /> (covers, thumbs, heroes) or
// <AvatarImage /> (people) which are transform-aware by default.
const RAW_IMG_RULE = {
  selector: "JSXOpeningElement[name.name='img']",
  message:
    "Use <OptimizedImage /> from '@/components/ui/optimized-image' (or <AvatarImage /> for people). Raw <img> bypasses Phase 2A transforms, lazy-loading, and CLS protection. See Performance Foundation Spec § 4.2.",
};

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-syntax": ["warn", RAW_IMG_RULE],
    },
  },
  {
    // Wrappers and primitives are allowed to use raw <img>.
    files: [
      "src/components/ui/optimized-image.tsx",
      "src/components/ui/avatar.tsx",
      "src/components/header/Logo.tsx",
      "src/components/mobile/DnaMobileHeader.tsx",
      "src/components/mobile/MobileHeader.tsx",
      "src/components/UnifiedHeader.tsx",
    ],
    rules: { "no-restricted-syntax": "off" },
  }
);
