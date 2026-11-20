import { formatNumber } from '../utils/format'
import { ChevronLeftIcon, ChevronRightIcon, LogOutIcon, WalletIcon } from './Icons'
import './Sidebar.css'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// 왼쪽 사이드바: 연도 이동 + 월 선택 + 월별 지출 합계
function Sidebar({ year, month, monthlyExpense, onSelect, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">
          <WalletIcon />
        </span>
        가계부
      </div>

      <div className="sidebar__year">
        <button
          type="button"
          className="icon-btn"
          onClick={() => onSelect(year - 1, month)}
          aria-label="이전 연도"
          title="이전 연도"
        >
          <ChevronLeftIcon />
        </button>
        <span className="sidebar__year-label">{year}년</span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => onSelect(year + 1, month)}
          aria-label="다음 연도"
          title="다음 연도"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="sidebar__section-label">
        <span>월</span>
        <span>지출</span>
      </div>

      <nav className="sidebar__months" aria-label="월 선택">
        {MONTHS.map((m) => {
          const total = monthlyExpense[m - 1]
          const isActive = m === month
          return (
            <button
              key={m}
              type="button"
              className={`sidebar__month${isActive ? ' is-active' : ''}`}
              onClick={() => onSelect(year, m)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{m}월</span>
              <span className="sidebar__month-total">{total > 0 ? formatNumber(total) : '–'}</span>
            </button>
          )
        })}
      </nav>

      <button type="button" className="sidebar__logout" onClick={onLogout}>
        <LogOutIcon />
        로그아웃
      </button>
    </aside>
  )
}

export default Sidebar
