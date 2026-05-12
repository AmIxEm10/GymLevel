## 2026-05-11 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those containing `<Plus>`, `<Minus>`, or `<X>`) within the workout components frequently lack textual representations, rendering them poorly accessible for screen reader users.
**Action:** When working on interactive `<Pressable>` components or similar elements that do not contain visible text, proactively ensure `aria-label` attributes are included to convey their purpose.
