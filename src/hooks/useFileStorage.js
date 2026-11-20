import { useEffect, useRef, useState } from 'react'
import {
  confirmOpenedBudgetFile,
  openBudgetFile,
  parseBudgetFile,
  readLastBudgetFile,
  saveBudgetFile,
} from '../utils/fileStorage'

// 어떤 파일에 저장했는지 / 저장 안 된 변경이 있는지 기억해 두는 곳
const META_KEY = 'budget_book.file'

function loadMeta(hasEntries) {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (raw) {
      const meta = JSON.parse(raw)
      return {
        name: typeof meta.name === 'string' ? meta.name : null,
        syncedAt: Number.isFinite(meta.syncedAt) ? meta.syncedAt : null,
        lastAction: meta.lastAction === 'load' ? 'load' : 'save',
        dirty: Boolean(meta.dirty),
      }
    }
  } catch {
    // 무시하고 기본값 사용
  }
  return { name: null, syncedAt: null, lastAction: 'save', dirty: hasEntries }
}

// JSON 파일 저장 / 불러오기 상태 관리
// notify(text, tone): 화면에 알림 띄우기
export function useFileStorage({ entries, replaceEntries, notify }) {
  const [meta, setMeta] = useState(() => loadMeta(entries.length > 0))
  const [fileHandle, setFileHandle] = useState(null) // 연결된 파일 (브라우저: 파일 핸들, Electron: 파일 경로)
  const busyRef = useRef(false)
  const startMetaRef = useRef(meta)

  useEffect(() => {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta))
    } catch {
      // 상태 표시용이라 실패해도 기록에는 영향 없음
    }
  }, [meta])

  // Electron 앱: 시작할 때 마지막으로 쓴 JSON 파일을 연결하고,
  // 저장 안 된 변경이 없으면 그 파일 내용을 불러온다. (파일이 진짜 저장소)
  useEffect(() => {
    let cancelled = false

    readLastBudgetFile()
      .then((last) => {
        if (cancelled || !last) return
        setFileHandle(last.path)

        if (startMetaRef.current.dirty) {
          // 파일에 저장 안 한 작업이 남아 있으면 그 작업을 그대로 둔다
          setMeta((prev) => ({ ...prev, name: last.name }))
          return
        }

        try {
          const parsed = parseBudgetFile(last.text)
          replaceEntries(parsed.entries)
          setMeta({ name: last.name, syncedAt: Date.now(), lastAction: 'load', dirty: false })
        } catch (error) {
          notify(`'${last.name}'을(를) 불러오지 못했어요. ${error.message}`, 'error')
        }
      })
      .catch((error) => console.error('마지막 가계부 파일을 읽지 못했습니다.', error))

    return () => {
      cancelled = true
    }
    // 앱 시작 시 한 번만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function markDirty() {
    setMeta((prev) => (prev.dirty ? prev : { ...prev, dirty: true }))
  }

  // saveAs: true 면 연결된 파일이 있어도 새 위치를 묻는다 (다른 이름으로 저장)
  async function save({ saveAs = false } = {}) {
    if (busyRef.current) return false
    busyRef.current = true
    try {
      const result = await saveBudgetFile(entries, fileHandle, { saveAs })
      if (!result) return false

      setFileHandle(result.handle)
      setMeta({ name: result.name, syncedAt: Date.now(), lastAction: 'save', dirty: false })
      notify(
        result.mode === 'download'
          ? `다운로드 폴더에 '${result.name}'로 저장했어요`
          : `'${result.name}'에 저장했어요`,
      )
      return true
    } catch (error) {
      console.error(error)
      setFileHandle(null) // 다음 저장 때 위치를 다시 고르도록
      notify('파일에 저장하지 못했어요. 다시 시도해 주세요.', 'error')
      return false
    } finally {
      busyRef.current = false
    }
  }

  // 불러오기에 성공하면 true
  async function open() {
    if (busyRef.current) return false
    busyRef.current = true
    try {
      const picked = await openBudgetFile()
      if (!picked) return false

      let parsed
      try {
        parsed = parseBudgetFile(picked.text)
      } catch (error) {
        notify(`'${picked.name}'을(를) 불러오지 못했어요. ${error.message}`, 'error')
        return false
      }

      if (entries.length > 0) {
        const lines = [
          `지금 기록 ${entries.length}건을 '${picked.name}'의 기록 ${parsed.entries.length}건으로 바꿀까요?`,
        ]
        if (meta.dirty) lines.push('파일에 저장하지 않은 변경 사항은 사라져요.')
        if (!window.confirm(lines.join('\n'))) return false
      }

      replaceEntries(parsed.entries)
      await confirmOpenedBudgetFile()
      setFileHandle(picked.handle)
      setMeta({ name: picked.name, syncedAt: Date.now(), lastAction: 'load', dirty: false })
      notify(
        `'${picked.name}'에서 ${parsed.entries.length}건을 불러왔어요` +
          (parsed.skipped > 0 ? ` (잘못된 기록 ${parsed.skipped}건 제외)` : ''),
      )
      return true
    } catch (error) {
      console.error(error)
      notify('파일을 여는 중 문제가 생겼어요.', 'error')
      return false
    } finally {
      busyRef.current = false
    }
  }

  return {
    fileName: meta.name,
    syncedAt: meta.syncedAt,
    lastAction: meta.lastAction,
    isDirty: meta.dirty,
    isConnected: fileHandle != null,
    markDirty,
    save,
    open,
  }
}
