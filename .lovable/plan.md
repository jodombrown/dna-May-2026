## Plan: Tailwind config truth patch

Update `tailwind.config.ts` with two additive tokens and verify the build still compiles.

### Changes
1. In `theme.extend.fontSize`, add the `hero` token:
   ```ts
   hero: ['3rem', { lineHeight: '1.05', fontWeight: '600' }], // 48px - marketing hero only
   ```
2. In `theme.extend.fontFamily`, add the `body` alias:
   ```ts
   body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
   ```

### Non-changes
- `sans`, `ui`, `serif`, and `heritage` aliases remain untouched as legacy aliases.
- No call-site usage will be changed in this patch; the gate prevents new code from using the old aliases.

### Verification
- Run `npm run build` (or the project's typecheck/build check) to confirm the config parses cleanly.
- No visual changes are expected until a component consumes `text-hero` or `font-body`.

