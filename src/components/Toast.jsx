import { AlertIcon, CheckIcon } from './Icons'
import './Toast.css'

// 잠깐 떴다 사라지는 알림 (notice: { text, tone: 'success' | 'error', n })
function Toast({ notice }) {
  if (!notice) return null

  return (
    <div key={notice.n} className={`toast toast--${notice.tone}`} role="status" aria-live="polite">
      {notice.tone === 'error' ? <AlertIcon /> : <CheckIcon />}
      <span>{notice.text}</span>
    </div>
  )
}

export default Toast
