const listeners = new Set<() => void>();

export function subscribeCartRefresh(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitCartRefresh(): void {
  listeners.forEach((fn) => {
    fn();
  });
}
