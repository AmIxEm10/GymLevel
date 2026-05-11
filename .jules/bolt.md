## 2024-06-25 - React Native Zustand Shallow Rendering
**Learning:** Returning dynamically created arrays (`[...a, ...b]` or `?? []`) inside Zustand selectors bypasses the default strict-equality (`===`) checks, triggering re-renders on the entire component tree on any unrelated state update.
**Action:** Always provide static empty arrays (`const EMPTY_MESSAGES = []`) as fallbacks in selectors and use `useShallow` from `zustand/react/shallow` in the component side when dealing with dynamically assembled arrays to prevent UI thrashing.
