// 금액 표시/입력 관련 도우미

// 12,000
export function formatNumber(value) {
  return value.toLocaleString('ko-KR')
}

// 12,000원
export function formatWon(value) {
  return `${formatNumber(value)}원`
}

// "12,000" → 12000 (숫자가 없으면 0)
export function parseAmount(text) {
  const digits = String(text).replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

// 저장/불러온 시각: 오늘이면 "오후 3:30", 아니면 "11월 19일"
export function formatSyncedAt(timestamp) {
  const date = new Date(timestamp)
  const isToday = date.toDateString() === new Date().toDateString()
  return isToday
    ? date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

// 입력 중인 금액 문자열을 "12,000" 형태로 정리 (최대 12자리)
export function normalizeAmountInput(text) {
  const digits = String(text).replace(/\D/g, '').replace(/^0+/, '').slice(0, 12)
  return digits ? formatNumber(Number(digits)) : ''
}
