import { useEffect, useMemo, useRef, useState } from 'react'
import Composer from '../components/Composer'
import EntryList from '../components/EntryList'
import FileBar from '../components/FileBar'
import Sidebar from '../components/Sidebar'
import SummaryCards from '../components/SummaryCards'
import Toast from '../components/Toast'
import { useEntries } from '../hooks/useEntries'
import { useFileStorage } from '../hooks/useFileStorage'
import { formatNumber, formatWon } from '../utils/format'
import './MainPage.css'

const emptyDraft = (type = 'expense') => ({ type, name: '', amount: '' })

function getToday() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function MainPage({ onLogout }) {
  const [today] = useState(getToday)
  const thisYear = today.year
  const thisMonth = today.month

  const [year, setYear] = useState(thisYear)
  const [month, setMonth] = useState(thisMonth)
  const { entries, addEntry, updateEntry, removeEntry, replaceEntries } = useEntries()

  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [flash, setFlash] = useState(null) // { id, n } 방금 추가/수정한 줄 표시용
  const [notice, setNotice] = useState(null) // { text, tone, n } 화면 위 알림
  const nameInputRef = useRef(null)

  function notify(text, tone = 'success') {
    setNotice((prev) => ({ text, tone, n: (prev?.n ?? 0) + 1 }))
  }

  const file = useFileStorage({ entries, replaceEntries, notify })

  // 알림은 잠깐 보여 주고 사라지게
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), notice.tone === 'error' ? 4500 : 2600)
    return () => clearTimeout(timer)
  }, [notice])

  // Ctrl+S 저장, Ctrl+Shift+S 다른 이름으로 저장
  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
        event.preventDefault()
        file.save({ saveAs: event.shiftKey })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  // 선택한 달의 기록 (입력한 순서대로)
  const monthEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.year === year && entry.month === month)
        .sort((a, b) => a.createdAt - b.createdAt),
    [entries, year, month],
  )

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const entry of monthEntries) {
      if (entry.type === 'income') income += entry.amount
      else expense += entry.amount
    }
    return { income, expense }
  }, [monthEntries])

  // 사이드바에 보여 줄 선택 연도의 월별 지출 합계
  const monthlyExpense = useMemo(() => {
    const totalsByMonth = Array(12).fill(0)
    for (const entry of entries) {
      if (entry.year === year && entry.type === 'expense') {
        totalsByMonth[entry.month - 1] += entry.amount
      }
    }
    return totalsByMonth
  }, [entries, year])

  const editingEntry = entries.find((entry) => entry.id === editingId) ?? null
  const isThisMonth = year === thisYear && month === thisMonth

  function flashRow(id) {
    setFlash((prev) => ({ id, n: (prev?.n ?? 0) + 1 }))
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft((prev) => emptyDraft(prev.type))
  }

  function selectMonth(nextYear, nextMonth) {
    setYear(nextYear)
    setMonth(nextMonth)
    setFlash(null)
    if (editingId) cancelEdit()
  }

  function handleSubmit({ type, name, amount }) {
    if (editingId) {
      updateEntry(editingId, { type, name, amount })
      flashRow(editingId)
      setEditingId(null)
    } else {
      const id = addEntry({ year, month, type, name, amount })
      flashRow(id)
    }
    file.markDirty()
    setDraft(emptyDraft(type))
    nameInputRef.current?.focus()
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setDraft({ type: entry.type, name: entry.name, amount: formatNumber(entry.amount) })
    nameInputRef.current?.focus()
  }

  function handleDelete(entry) {
    const ok = window.confirm(`'${entry.name}' ${formatWon(entry.amount)} 기록을 삭제할까요?`)
    if (!ok) return
    removeEntry(entry.id)
    file.markDirty()
    if (entry.id === editingId) cancelEdit()
  }

  async function handleOpen() {
    const loaded = await file.open()
    if (!loaded) return
    setFlash(null)
    if (editingId) cancelEdit()
  }

  return (
    <div className="app-shell">
      <Sidebar
        year={year}
        month={month}
        monthlyExpense={monthlyExpense}
        onSelect={selectMonth}
        onLogout={onLogout}
      />

      <main className="main">
        <FileBar
          fileName={file.fileName}
          syncedAt={file.syncedAt}
          lastAction={file.lastAction}
          isDirty={file.isDirty}
          isConnected={file.isConnected}
          onOpen={handleOpen}
          onSave={() => file.save()}
        />

        <div className="main__scroll">
          <div className="main__inner">
            <header className="main__header">
              <div>
                <h1 className="main__title">
                  {year}년 {month}월
                </h1>
                <p className="main__subtitle">
                  {monthEntries.length > 0 ? `${monthEntries.length}건의 기록` : '기록 없음'}
                </p>
              </div>
              {!isThisMonth && (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => selectMonth(thisYear, thisMonth)}
                >
                  이번 달로
                </button>
              )}
            </header>

            <SummaryCards income={totals.income} expense={totals.expense} />

            <EntryList
              entries={monthEntries}
              editingId={editingId}
              flash={flash}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>

        <div className="main__composer">
          <Composer
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={handleSubmit}
            editingEntry={editingEntry}
            onCancelEdit={cancelEdit}
            year={year}
            month={month}
            nameInputRef={nameInputRef}
          />
        </div>

        <Toast notice={notice} />
      </main>
    </div>
  )
}

export default MainPage
