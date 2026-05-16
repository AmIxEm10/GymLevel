## 2026-05-11 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those containing `<Plus>`, `<Minus>`, or `<X>`) within the workout components frequently lack textual representations, rendering them poorly accessible for screen reader users.
**Action:** When working on interactive `<Pressable>` components or similar elements that do not contain visible text, proactively ensure `aria-label` attributes are included to convey their purpose.
## 2024-05-17 - Add aria-labels to icon-only buttons
**Learning:** Found several icon-only buttons (like X close buttons and + / - adjustment buttons) lacking aria-labels which makes the app inaccessible to screen readers. React Native `Pressable` components need explicit `aria-label` when only containing an icon to correctly read the intent.
**Action:** When creating generic button wrappers (like `AdjustBtn`), we should expose an `aria-label` prop. For simple components, always add `aria-label` indicating the action (e.g. "Close", "Go back").
