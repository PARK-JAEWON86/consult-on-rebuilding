export function toIdemKey(...parts: (string|number|undefined|null)[]) {
  return parts.filter(Boolean).join(':');
}
