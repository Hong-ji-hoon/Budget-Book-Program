import { useEffect } from 'react'
import { formatWon } from '../utils/format'
import { PencilIcon, TrashIcon, WalletIcon } from './Icons'
import './EntryList.css'

const SECTIONS = [
  { type: 'income', title: '수입', emptyText: '아직 수입 기록이 없어요' },
  { type: 'expense', title: '지출', emptyText: '아직 지출 기록이 없어요' },
]

// 선택한 달의 기록 목록 (수입 / 지출로 나눠서 표시)
function EntryList({ entries, editingId, flash, onEdit, onDelete }) {
  // 방금 추가·수정한 줄이 보이도록 스크롤
  useEffect(() => {
    if (!flash) return
    document
      .getElementById(`entry-${flash.id}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [flash])

  if (entries.length === 0) {
    return (
      <div className="entries-empty">
        <span className="entries-empty__icon">
          <WalletIcon />
        </span>
        <p className="entries-empty__title">이 달의 기록이 아직 없어요</p>
        <p className="entries-empty__text">
          아래 입력창에 <b>항목 / 금액</b>을 적고 Enter를 누르면 추가돼요.
        </p>
      </div>
    )
  }

  return (
    <div className="entries">
      {SECTIONS.map((section) => {
        const items = entries.filter((entry) => entry.type === section.type)
        const subtotal = items.reduce((sum, entry) => sum + entry.amount, 0)

        return (
          <section key={section.type} className="entries__section">
            <header className="entries__header">
              <span className={`entries__title entries__title--${section.type}`}>
                {section.title}
                <span className="entries__count">{items.length}건</span>
              </span>
              <span className="entries__subtotal">{formatWon(subtotal)}</span>
            </header>

            {items.length === 0 ? (
              <p className="entries__empty">{section.emptyText}</p>
            ) : (
              <ul className="entries__list">
                {items.map((entry) => (
                  <li
                    key={entry.id}
                    id={`entry-${entry.id}`}
                    className={`entry${entry.id === editingId ? ' is-editing' : ''}`}
                  >
                    {flash?.id === entry.id && <span key={flash.n} className="entry__flash" />}
                    <span className="entry__name">{entry.name}</span>
                    <span className="entry__actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onEdit(entry)}
                        aria-label={`${entry.name} 수정`}
                        title="수정"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => onDelete(entry)}
                        aria-label={`${entry.name} 삭제`}
                        title="삭제"
                      >
                        <TrashIcon />
                      </button>
                    </span>
                    <span className={`entry__amount entry__amount--${entry.type}`}>
                      {entry.type === 'income' ? '+' : '-'}
                      {formatWon(entry.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

export default EntryList
