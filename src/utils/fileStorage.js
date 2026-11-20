import { normalizeEntries } from './entries'

// ===== 가계부 JSON 파일 저장 / 불러오기 =====
// 파일 모양:
// {
//   "app": "budget_book",
//   "version": 1,
//   "savedAt": "2026-11-20T06:30:00.000Z",
//   "entries": [ { "id": "...", "year": 2026, "month": 11, "type": "expense", "name": "점심", "amount": 12000, "createdAt": 1795... } ]
// }

const DEFAULT_FILE_NAME = 'budget_book.json'
const FILE_TYPES = [
  {
    description: '가계부 JSON 파일',
    accept: { 'application/json': ['.json'] },
  },
]

// 저장 방식은 실행 환경에 따라 세 가지:
// 1) Electron 앱: electron/preload.cjs 가 만든 window.budgetFile 로 진짜 파일에 저장
//    (마지막 파일 경로를 기억해서 다음부터는 묻지 않음)
// 2) 크롬/엣지 브라우저: 파일을 직접 골라서 덮어쓰기
// 3) 그 밖의 브라우저: 다운로드 / 파일 선택 창
function desktopBridge() {
  return window.budgetFile ?? null
}

export function isDesktopApp() {
  return desktopBridge() != null
}

export function canUseFilePicker() {
  return typeof window.showSaveFilePicker === 'function' && typeof window.showOpenFilePicker === 'function'
}

export function serializeBudget(entries) {
  const data = {
    app: 'budget_book',
    version: 1,
    savedAt: new Date().toISOString(),
    entries,
  }
  return JSON.stringify(data, null, 2)
}

// 파일 내용(문자열) → { entries, skipped }. 가계부 파일이 아니면 Error
export function parseBudgetFile(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('JSON 형식이 올바르지 않은 파일이에요.')
  }

  const list = Array.isArray(data) ? data : data?.entries
  if (!Array.isArray(list)) {
    throw new Error('가계부 파일이 아니에요. (entries 목록이 없어요)')
  }

  return normalizeEntries(list)
}

// Electron 앱: 마지막으로 쓴 파일 { path, name, text } (없으면 null)
export async function readLastBudgetFile() {
  const bridge = desktopBridge()
  return bridge ? bridge.readLast() : null
}

// Electron 앱: 불러온 파일을 앞으로 저장할 파일로 기억
export async function confirmOpenedBudgetFile() {
  const bridge = desktopBridge()
  if (bridge) await bridge.confirmOpen()
}

// 저장. handle(연결된 파일)이 있으면 그 파일에 덮어쓰고, 없거나 saveAs면 저장할 위치를 묻는다.
// 사용자가 취소하면 null
export async function saveBudgetFile(entries, handle, { saveAs = false } = {}) {
  const text = serializeBudget(entries)

  const bridge = desktopBridge()
  if (bridge) {
    const result = await bridge.save(text, { saveAs: saveAs || !handle })
    if (!result) return null
    return { mode: 'file', handle: result.path, name: result.name }
  }

  if (canUseFilePicker()) {
    let target = saveAs ? null : handle
    if (!target) {
      try {
        target = await window.showSaveFilePicker({ suggestedName: DEFAULT_FILE_NAME, types: FILE_TYPES })
      } catch (error) {
        if (error?.name === 'AbortError') return null
        throw error
      }
    }
    const writable = await target.createWritable()
    await writable.write(text)
    await writable.close()
    return { mode: 'file', handle: target, name: target.name }
  }

  // 대체 방식: 다운로드 폴더에 파일로 내려받기
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = DEFAULT_FILE_NAME
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { mode: 'download', handle: null, name: DEFAULT_FILE_NAME }
}

// 불러오기. 파일을 골라 { text, handle, name }을 돌려준다. 취소하면 null
export async function openBudgetFile() {
  const bridge = desktopBridge()
  if (bridge) {
    const result = await bridge.open()
    if (!result) return null
    return { text: result.text, handle: result.path, name: result.name }
  }

  if (canUseFilePicker()) {
    try {
      const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES, multiple: false })
      const file = await handle.getFile()
      return { text: await file.text(), handle, name: file.name }
    } catch (error) {
      if (error?.name === 'AbortError') return null
      throw error
    }
  }

  // 대체 방식: 파일 선택 창
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      try {
        resolve({ text: await file.text(), handle: null, name: file.name })
      } catch (error) {
        reject(error)
      }
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}
