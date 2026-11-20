// 가계부 기록(entry) 관련 공통 도우미
// 기록 하나의 모양:
// { id, year, month, type: 'income' | 'expense', name, amount, createdAt }

export function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// 기록 하나를 검사해서 올바른 모양으로 정리. 잘못된 기록이면 null
function normalizeEntry(raw, index) {
  if (!raw || typeof raw !== 'object') return null

  const year = Number(raw.year)
  const month = Number(raw.month)
  const amount = Number(raw.amount)
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''

  if (!Number.isInteger(year) || year < 1900 || year > 9999) return null
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  if (raw.type !== 'income' && raw.type !== 'expense') return null
  if (!name) return null
  if (!Number.isSafeInteger(amount) || amount <= 0) return null

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    year,
    month,
    type: raw.type,
    name: name.slice(0, 40),
    amount,
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : index,
  }
}

// 기록 목록 전체를 검사. 잘못된 기록은 빼고, 몇 개를 뺐는지 알려 준다.
export function normalizeEntries(list) {
  const entries = []
  const seenIds = new Set()
  let skipped = 0

  list.forEach((raw, index) => {
    const entry = normalizeEntry(raw, index)
    if (!entry) {
      skipped += 1
      return
    }
    if (seenIds.has(entry.id)) entry.id = createId()
    seenIds.add(entry.id)
    entries.push(entry)
  })

  return { entries, skipped }
}
