import { useEffect, useState } from 'react'
import { createId, normalizeEntries } from '../utils/entries'

// 작업 중인 기록은 브라우저 저장소(localStorage)에도 자동으로 보관해 둔다.
// (JSON 파일로 저장하기 전에 앱을 꺼도 기록이 사라지지 않게 하는 안전장치)
// 기록 하나의 모양:
// { id, year, month, type: 'income' | 'expense', name, amount, createdAt }
const STORAGE_KEY = 'budget_book.entries'

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? normalizeEntries(parsed).entries : []
  } catch {
    return []
  }
}

export function useEntries() {
  const [entries, setEntries] = useState(loadEntries)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch (error) {
      console.error('가계부 임시 저장에 실패했습니다.', error)
    }
  }, [entries])

  function addEntry(entry) {
    const created = { ...entry, id: createId(), createdAt: Date.now() }
    setEntries((prev) => [...prev, created])
    return created.id
  }

  function updateEntry(id, changes) {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)))
  }

  function removeEntry(id) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  // 파일에서 불러온 기록으로 통째로 바꾸기
  function replaceEntries(nextEntries) {
    setEntries(nextEntries)
  }

  return { entries, addEntry, updateEntry, removeEntry, replaceEntries }
}
