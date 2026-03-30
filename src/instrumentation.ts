export async function register() {
  // Next.js 15.x may start Node workers with --localstorage-file pointing to
  // an invalid path.  Node 21+ exposes a global `localStorage` when that flag
  // is present, but the object can be broken (getItem is not a function).
  // Libraries like next-themes detect `typeof localStorage !== "undefined"` and
  // crash during SSR.  Removing the broken global restores the expected
  // server-side behavior.
  if (typeof window === 'undefined' && typeof globalThis.localStorage !== 'undefined') {
    try {
      globalThis.localStorage.getItem('__probe__');
    } catch {
      // @ts-expect-error intentionally removing broken global
      delete globalThis.localStorage;
    }

    // If getItem simply doesn't exist as a function, also clean up
    if (
      typeof globalThis.localStorage !== 'undefined' &&
      typeof globalThis.localStorage.getItem !== 'function'
    ) {
      // @ts-expect-error intentionally removing broken global
      globalThis.localStorage = undefined;
    }
  }
}
