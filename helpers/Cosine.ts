export function cosine(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0
  }

  let dot = 0,
    na = 0,
    nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }

  const magnitude = Math.sqrt(na) * Math.sqrt(nb)
  if (magnitude === 0) return 0

  return dot / magnitude
}
