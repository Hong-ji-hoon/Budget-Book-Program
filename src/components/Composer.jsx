import { useRef, useState } from 'react'
import { normalizeAmountInput, parseAmount } from '../utils/format'
import { AlertIcon, ArrowUpIcon, CheckIcon, PencilIcon, XIcon } from './Icons'
import './Composer.css'

const TYPES = [
  { value: 'expense', label: '지출' },
  { value: 'income', label: '수입' },
]

// Codex 스타일 하단 입력창. 양식은 [구분] 항목 / 금액 으로 고정.
// - 추가: 항목, 금액 입력 후 Enter
// - 수정: 목록에서 연필 버튼 → 값이 채워지고 Enter로 저장, Esc로 취소
function Composer({ draft, onDraftChange, onSubmit, editingEntry, onCancelEdit, year, month, nameInputRef }) {
  const [error, setError] = useState(null) // { message, field, n }
  const amountRef = useRef(null)

  const isEditing = editingEntry != null
  const isReady = draft.name.trim() !== '' && parseAmount(draft.amount) > 0

  function update(changes) {
    onDraftChange({ ...draft, ...changes })
    if (error) setError(null)
  }

  function fail(message, field, inputRef) {
    setError((prev) => ({ message, field, n: (prev?.n ?? 0) + 1 }))
    inputRef.current?.focus()
  }

  function submit() {
    const name = draft.name.trim()
    const amount = parseAmount(draft.amount)

    if (!name) {
      fail('항목을 입력해 주세요.', 'name', nameInputRef)
      return
    }
    if (!amount) {
      fail('금액을 입력해 주세요.', 'amount', amountRef)
      return
    }

    setError(null)
    onSubmit({ type: draft.type, name, amount })
  }

  function cancel() {
    setError(null)
    if (isEditing) onCancelEdit()
  }

  // 항목 칸에서 Enter: 금액이 비어 있으면 금액 칸으로 이동, 다 채워져 있으면 저장
  // (한글 입력 중 Enter는 글자 확정용이라 저장하지 않음)
  function handleNameKeyDown(event) {
    if (event.key === 'Escape') {
      cancel()
      return
    }
    if (event.key !== 'Enter') return

    const isComposing = event.nativeEvent.isComposing
    if (!parseAmount(draft.amount)) {
      if (draft.name.trim() || isComposing) amountRef.current?.focus()
      else fail('항목을 입력해 주세요.', 'name', nameInputRef)
      return
    }
    if (!isComposing) submit()
  }

  function handleAmountKeyDown(event) {
    if (event.key === 'Escape') {
      cancel()
      return
    }
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) submit()
  }

  const typeLabel = draft.type === 'income' ? '수입으로' : '지출로'

  return (
    <div className="composer">
      <div className={`composer__box${isEditing ? ' is-editing' : ''}`}>
        {isEditing && (
          <div className="composer__edit-bar">
            <PencilIcon />
            <span className="composer__edit-text">
              <b>{editingEntry.name}</b> 수정 중
            </span>
            <button type="button" className="composer__edit-cancel" onClick={cancel}>
              <XIcon />
              취소
            </button>
          </div>
        )}

        <div className="composer__row">
          <div className="segmented" role="group" aria-label="구분">
            {TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                className={`segmented__btn segmented__btn--${type.value}`}
                aria-pressed={draft.type === type.value}
                onClick={() => update({ type: type.value })}
              >
                {type.label}
              </button>
            ))}
          </div>

          <input
            ref={nameInputRef}
            className="composer__input composer__name"
            value={draft.name}
            onChange={(event) => update({ name: event.target.value })}
            onKeyDown={handleNameKeyDown}
            placeholder={draft.type === 'income' ? '항목 (예: 월급, 용돈)' : '항목 (예: 점심, 교통비)'}
            aria-label="항목"
            aria-invalid={error?.field === 'name'}
            maxLength={40}
            autoComplete="off"
          />

          <span className="composer__slash" aria-hidden="true">
            /
          </span>

          <label className="composer__amount">
            <input
              ref={amountRef}
              className="composer__input"
              value={draft.amount}
              onChange={(event) => update({ amount: normalizeAmountInput(event.target.value) })}
              onKeyDown={handleAmountKeyDown}
              placeholder="금액"
              inputMode="numeric"
              aria-label="금액"
              aria-invalid={error?.field === 'amount'}
              autoComplete="off"
            />
            <span className="composer__unit">원</span>
          </label>

          <button
            type="button"
            className={`composer__send${isReady ? ' is-ready' : ''}`}
            onClick={submit}
            aria-label={isEditing ? '수정 저장' : '추가'}
            title={isEditing ? '수정 저장 (Enter)' : '추가 (Enter)'}
          >
            {isEditing ? <CheckIcon /> : <ArrowUpIcon />}
          </button>
        </div>
      </div>

      <div className="composer__meta" aria-live="polite">
        {error ? (
          <span key={error.n} className="composer__error" role="alert">
            <AlertIcon />
            {error.message}
          </span>
        ) : (
          <span>
            {year}년 {month}월{' '}
            <b className={`composer__type composer__type--${draft.type}`}>{typeLabel}</b>{' '}
            {isEditing ? '저장돼요' : '기록돼요'}
          </span>
        )}
        <span className="composer__keys">
          <kbd>Enter</kbd> {isEditing ? '저장' : '추가'}
          {isEditing && (
            <>
              {' '}
              <kbd>Esc</kbd> 취소
            </>
          )}
        </span>
      </div>
    </div>
  )
}

export default Composer
