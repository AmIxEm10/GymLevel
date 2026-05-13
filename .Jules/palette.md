## 2026-05-11 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those containing `<Plus>`, `<Minus>`, or `<X>`) within the workout components frequently lack textual representations, rendering them poorly accessible for screen reader users.
**Action:** When working on interactive `<Pressable>` components or similar elements that do not contain visible text, proactively ensure `aria-label` attributes are included to convey their purpose.

## 2024-05-13 - Icon-Only Button Accessibility Pattern
**Learning:** Found a widespread pattern in the app's components (especially Modals and navigation headers) where `<Pressable>` components containing only a lucide-react-native icon (like `<X />`) were lacking `aria-label`s. This is a critical accessibility issue because screen readers cannot interpret the visual meaning of an SVG icon, rendering these interactive close/back buttons invisible or confusing to visually impaired users.
**Action:** When reviewing or creating new modals or screen headers, always verify that any `<Pressable>` or `<TouchableOpacity>` functioning as an icon-only button includes a descriptive `aria-label` (e.g., `aria-label="Fermer"` or `aria-label="Retour"`).
