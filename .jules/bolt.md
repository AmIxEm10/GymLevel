## 2024-06-25 - React Native Zustand Shallow Rendering
**Learning:** Returning dynamically created arrays (`[...a, ...b]` or `?? []`) inside Zustand selectors bypasses the default strict-equality (`===`) checks, triggering re-renders on the entire component tree on any unrelated state update.
**Action:** Always provide static empty arrays (`const EMPTY_MESSAGES = []`) as fallbacks in selectors and use `useShallow` from `zustand/react/shallow` in the component side when dealing with dynamically assembled arrays to prevent UI thrashing.
## 2026-05-15 - Precompute Static Arrays
**Learning:** Computing map/filter operations on static datasets (like 'EXERCISES') inside render cycles causes unnecessary re-evaluations and performance overhead.
**Action:** Extract the static logic outside the component file scope or into a useMemo to only compute it once.
