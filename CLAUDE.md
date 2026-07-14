# Design system rules

These are not preferences. A change that violates them is a defect regardless of how good it looks in isolation.

Read this before writing any UI code. If a request cannot be satisfied within these rules, say so and propose a token or variant change instead of working around them.

## The one-sentence version

Every color, size, space, radius, and shadow in this product comes from `tokens.css`. Every page composes from the primitives. If a value or a look is not already in the system, the correct move is to extend the system, never to special-case the call site.

## Hard prohibitions

Violating any of these is a bug. There are no exceptions for "just this once," and "the designer asked for it" is not an exception either, it is a request to change a token.

1. **No raw color values.** No hex, no `rgb()`, no `hsl()` literals in any component, page, or style. Use the semantic tokens: `text-foreground`, `bg-card`, `border-border`, `text-accent`.
2. **No arbitrary values.** No `text-[17px]`, no `p-[13px]`, no `bg-[#1a1b1e]`, no `w-[347px]`, no `top-[3px]`. Bracket syntax is banned in `src/`. It is the single clearest fingerprint of generated code and it is where drift lives.
3. **No font sizes outside the scale.** The scale is: `caption small body lead title heading display`. `text-3xl` does not exist in this config and will silently render nothing.
4. **No new fonts.** Two families, declared in tokens. Adding a third requires an explicit decision, not a component.
5. **No page-level layout values.** A file in `src/pages` may not contain `max-w-`, `px-`, `py-`, `mt-`, `mb-`, or `container`. Those belong to `Section` and `Container`. This rule is what makes pages feel identical.
6. **No `className` overrides that change appearance.** If you are passing `className="bg-accent text-white rounded-full"` to `<Button>`, you have found a missing variant. Add it to the component's `cva` definition and use it by name. `className` on a design-system component is for layout positioning only (e.g. `w-full`), never for restyling.
7. **No inline `style` props** except for genuinely dynamic values (a computed transform, a data-driven width percentage).
8. **No new breakpoints.** Three exist: `sm md lg`. The type and space scales are fluid and already handle most responsive behaviour without a breakpoint. Reach for a breakpoint only when the LAYOUT changes, never to resize text.

## Required patterns

**Page structure.** Every page is Sections. Every Section holds one Container. Containers hold Stacks and Grids. Nothing else.

```tsx
<Section tone="muted">
  <Container>
    <Stack gap="l">
      <h2>Title</h2>
      <Grid cols={3}>{...}</Grid>
    </Stack>
  </Container>
</Section>
```

**Spacing belongs to the parent.** Never put a margin on a child to push it away from a sibling. Use `Stack` or `Grid` and set `gap`. An element must not know what is next to it.

**Headings are semantic.** Use `<h1>`/`<h2>`/`<h3>`. They are already styled by `tokens.css`. Do not restyle them at the call site. Do not use an `<h2>` because you wanted big text: if you want big text on a non-heading, that is `text-heading` on a `<p>` or `<div>`.

**New variants, not new components.** Before creating `PrimaryButton`, check whether `Button` needs a variant. Before creating `FeatureCard`, check whether `Card` does.

## Anti-vibecode rules

Consistency and taste are different problems. The system above delivers consistency. These rules exist so the consistent thing does not look machine-generated. All of these are things generated UI reaches for by reflex.

- No gradient text. No purple-to-blue gradient anything.
- No icon-in-a-pastel-circle grids. The three-column card grid of icon + bold heading + two lines of grey text is the default output of every AI web builder currently shipping. If you must use a card grid, make the cards do something specific to this product.
- Not everything is a card. Rounded rectangle plus soft shadow is not the only container. Consider hairlines, plain lists, generous whitespace, a bordered table, an asymmetric split.
- Not everything is centered. Center-aligned everything reads as a template. Left-align by default; center only when it earns it.
- Vary density. A page where every section has the same padding, the same three columns, and the same amount of text is a page nobody remembers. Some sections should be dense, some should be nearly empty.
- Use the asymmetric grid variants (`feature`, `sidebar`). At least once per page, break the symmetry.
- One accent, used sparingly. The accent color earns its power from scarcity. If it appears in six places on a screen it is not an accent, it is a background.
- No emoji in headings or UI copy.
- Restraint in motion. Fade-up on scroll, once, for one element. Not for every card in a grid, staggered. Scattered animation is a tell.
- Copy is design material. "Empower your journey to unlock seamless solutions" is generated copy. Name what the thing does, specifically, in the fewest words. Buttons say what happens: "Publish," not "Submit."

## When you want to change something

Correct order, always:

1. Can it be expressed with existing tokens and variants? Do that.
2. Does it need a new variant on an existing component? Add it to the `cva` definition, then use it by name.
3. Does it need a new token? Add it to `tokens.css` LAYER 1 or 2, and say out loud that you are changing the system.
4. Only if all three fail is anything else on the table, and you must flag it.

Never solve a styling problem at the call site. That is how this codebase got inconsistent in the first place.

## Refactoring discipline

- One page per commit. Do not sweep the whole codebase in a single pass.
- After converting a page, diff it visually against `/styleguide` and against the previously converted page. They should feel like the same product.
- If the audit inventory says a value appears 200 times, it is part of the system whether or not you like it. Regularize toward the majority, not toward your taste.
- Do not "improve" things you were not asked to touch. Scope creep in a design refactor is how a working site breaks.

## Verification before you claim done

- `npm run lint` passes, including the no-arbitrary-values rule.
- `npm run guard:tokens` passes (grep guard for raw hex and bracket syntax).
- The page renders correctly at 360px, 768px, and 1440px.
- Keyboard focus is visible on every interactive element.
- No new font, color, size, or spacing value entered the codebase.
