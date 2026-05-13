## 2025-02-14 - Prevent Information Exposure in Error Boundaries
**Vulnerability:** Raw error stack traces and internal application state were being logged to the client console via `console.error` in the global `ErrorBoundary`.
**Learning:** Expo/React Native projects use `__DEV__` to differentiate environments. Logging errors directly without this check exposes sensitive data in production builds.
**Prevention:** Always wrap diagnostic `console.error` or `console.log` calls that output error objects or stack traces with an `if (__DEV__)` condition in client-side code.
