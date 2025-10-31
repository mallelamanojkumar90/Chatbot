const STORAGE_KEY = 'chatgpt_clone_conversations_v1'

export function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { conversations: [], selectedId: null }
    const parsed = JSON.parse(raw)
    return {
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      selectedId: parsed.selectedId || null
    }
  } catch {
    return { conversations: [], selectedId: null }
  }
}

export function saveConversations(conversations, selectedId) {
  try {
    const payload = JSON.stringify({ conversations, selectedId })
    localStorage.setItem(STORAGE_KEY, payload)
  } catch {}
}


