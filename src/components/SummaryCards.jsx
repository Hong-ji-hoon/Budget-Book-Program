import { formatWon } from '../utils/format'
import './SummaryCards.css'

// 선택한 달의 수입 / 지출 / 남은 금액
function SummaryCards({ income, expense }) {
  const balance = income - expense
  const usedPercent = income > 0 ? Math.round((expense / income) * 100) : null

  return (
    <section className="summary" aria-label="이번 달 요약">
      <div className="summary__card">
        <span className="summary__label">
          <span className="summary__dot summary__dot--income" />
          수입
        </span>
        <strong className="summary__value">{formatWon(income)}</strong>
      </div>

      <div className="summary__card">
        <span className="summary__label">
          <span className="summary__dot summary__dot--expense" />
          지출 합계
        </span>
        <strong className="summary__value">{formatWon(expense)}</strong>
      </div>

      <div className="summary__card">
        <span className="summary__label">남은 금액</span>
        <strong className={`summary__value${balance < 0 ? ' is-negative' : ''}`}>
          {balance < 0 ? '-' : ''}
          {formatWon(Math.abs(balance))}
        </strong>
        {usedPercent !== null && (
          <div className="summary__usage">
            <div className="summary__bar">
              <span
                className={usedPercent > 100 ? 'is-over' : ''}
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>
            <span className="summary__hint">수입의 {usedPercent}% 사용</span>
          </div>
        )}
      </div>
    </section>
  )
}

export default SummaryCards
