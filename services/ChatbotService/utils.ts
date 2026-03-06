export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function generateSessionId(): string {
  return `cs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
