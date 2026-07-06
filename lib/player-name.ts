const NAME_KEY = "rm_cluedo_name";

export function rememberName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {}
}

export function recallName(): string | null {
  try {
    return localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}
