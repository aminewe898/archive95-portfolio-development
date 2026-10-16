// Preferences are optional; private browsing must never prevent the desktop booting.
export function readPreference(key: string, session = false) {
  try { return (session ? sessionStorage : localStorage).getItem(key) } catch { return null }
}
export function writePreference(key: string, value: string, session = false) {
  try { (session ? sessionStorage : localStorage).setItem(key, value) } catch { /* Use in-memory state. */ }
}
