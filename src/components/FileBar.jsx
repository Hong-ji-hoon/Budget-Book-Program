import { formatSyncedAt } from '../utils/format'
import { FileTextIcon, FolderOpenIcon, SaveIcon } from './Icons'
import './FileBar.css'

// 메인 화면 맨 위: 지금 연결된 JSON 파일 / 저장 상태 / 불러오기·저장 버튼
function FileBar({ fileName, syncedAt, lastAction, isDirty, isConnected, onOpen, onSave }) {
  let status = null
  if (isDirty) {
    status = (
      <span className="filebar__status is-dirty">
        <span className="filebar__dot" />
        저장 안 된 변경 사항
      </span>
    )
  } else if (fileName && syncedAt) {
    status = (
      <span className="filebar__status">
        {lastAction === 'load' ? '불러옴' : '저장됨'} · {formatSyncedAt(syncedAt)}
      </span>
    )
  }

  const saveTitle =
    (isConnected ? `'${fileName}'에 덮어쓰기 (Ctrl+S)` : '저장할 파일 선택 (Ctrl+S)') +
    '\n다른 이름으로 저장: Ctrl+Shift+S'

  return (
    <div className="filebar">
      <div className="filebar__file">
        <FileTextIcon />
        <span className={`filebar__name${fileName ? '' : ' is-empty'}`}>
          {fileName ?? '저장된 파일 없음'}
        </span>
        {status}
      </div>

      <div className="filebar__actions">
        <button type="button" className="filebar__btn" onClick={onOpen} title="JSON 파일 불러오기">
          <FolderOpenIcon />
          불러오기
        </button>
        <button
          type="button"
          className={`filebar__btn${isDirty ? ' is-primary' : ''}`}
          onClick={onSave}
          title={saveTitle}
        >
          <SaveIcon />
          저장
          <kbd>Ctrl+S</kbd>
        </button>
      </div>
    </div>
  )
}

export default FileBar
