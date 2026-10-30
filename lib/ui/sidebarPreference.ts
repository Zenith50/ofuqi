export const SIDEBAR_STORAGE_KEY = "ofuqi-dashboard-sidebar-collapsed";
export const LEGACY_SIDEBAR_STORAGE_KEY = "oc-cv-maker-dashboard-sidebar-collapsed";

export function persistSidebarCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  } catch {
    // Ignore storage access issues and keep the current interaction in memory.
  }

  document.cookie = `${SIDEBAR_STORAGE_KEY}=${collapsed}; path=/; max-age=31536000; samesite=lax`;
}

export function readStoredSidebarCollapsed() {
  try {
    const persistedValue =
      window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
      ?? window.localStorage.getItem(LEGACY_SIDEBAR_STORAGE_KEY);
    if (persistedValue === "true" || persistedValue === "false") {
      return persistedValue === "true";
    }
  } catch {
    return null;
  }

  return null;
}
