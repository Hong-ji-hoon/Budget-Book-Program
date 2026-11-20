// ===== Electron 메인 프로세스 =====
// - 가계부 창을 띄운다.
// - JSON 파일 저장/불러오기를 진짜 파일 시스템(fs)으로 처리한다.
// - 마지막으로 쓴 파일 경로를 기억해서, 다음부터는 묻지 않고 그 파일에 저장한다.

const { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

// 개발 모드: scripts/electron-dev.mjs 가 --dev-server=http://localhost:xxxx 를 넘겨준다
const devServerArg = process.argv.find((arg) => arg.startsWith('--dev-server='))
const devServerUrl = devServerArg ? devServerArg.slice('--dev-server='.length) : null

const DEFAULT_FILE_NAME = 'budget_book.json'
const JSON_FILTERS = [{ name: '가계부 JSON 파일', extensions: ['json'] }]

// ----- 설정 파일 (마지막으로 쓴 가계부 파일 경로 기억) -----
function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

async function readSettings() {
  try {
    return JSON.parse(await fs.readFile(settingsPath(), 'utf8'))
  } catch {
    return {}
  }
}

async function writeSettings(patch) {
  const next = { ...(await readSettings()), ...patch }
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true })
  await fs.writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf8')
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// 저장 도중 앱이 꺼져도 파일이 깨지지 않도록 임시 파일에 쓴 뒤 바꿔치기
async function writeFileSafely(filePath, text) {
  const tempPath = `${filePath}.tmp`
  await fs.writeFile(tempPath, text, 'utf8')
  await fs.rename(tempPath, filePath)
}

// ----- 파일 저장/불러오기 (화면 쪽에서 preload.cjs 를 통해 호출) -----
let pendingOpenPath = null // 불러오기 창에서 고른 파일 (화면에서 확인을 마치면 기억)

function registerFileHandlers() {
  // 마지막으로 쓴 파일 정보 + 내용 (앱 시작 시 자동 불러오기용)
  ipcMain.handle('budget-file:read-last', async () => {
    const { lastFilePath } = await readSettings()
    if (!lastFilePath || !(await fileExists(lastFilePath))) return null
    const text = await fs.readFile(lastFilePath, 'utf8')
    return { path: lastFilePath, name: path.basename(lastFilePath), text }
  })

  // 저장: saveAs 이거나 기억된 파일이 없으면 저장 위치를 묻는다
  ipcMain.handle('budget-file:save', async (event, { text, saveAs }) => {
    if (typeof text !== 'string') throw new Error('저장할 내용이 올바르지 않습니다.')

    const { lastFilePath } = await readSettings()
    let target = saveAs ? null : lastFilePath

    if (!target) {
      const win = BrowserWindow.fromWebContents(event.sender)
      const defaultDir = lastFilePath ? path.dirname(lastFilePath) : app.getPath('documents')
      const result = await dialog.showSaveDialog(win, {
        title: '가계부 저장',
        defaultPath: path.join(defaultDir, lastFilePath ? path.basename(lastFilePath) : DEFAULT_FILE_NAME),
        filters: JSON_FILTERS,
      })
      if (result.canceled || !result.filePath) return null
      target = result.filePath
    }

    await writeFileSafely(target, text)
    await writeSettings({ lastFilePath: target })
    return { path: target, name: path.basename(target) }
  })

  // 불러오기: 파일을 골라 내용을 돌려준다 (아직 기억하지는 않음)
  ipcMain.handle('budget-file:open', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { lastFilePath } = await readSettings()
    const result = await dialog.showOpenDialog(win, {
      title: '가계부 불러오기',
      defaultPath: lastFilePath ? path.dirname(lastFilePath) : app.getPath('documents'),
      properties: ['openFile'],
      filters: JSON_FILTERS,
    })
    if (result.canceled || !result.filePaths[0]) return null

    const target = result.filePaths[0]
    const text = await fs.readFile(target, 'utf8')
    pendingOpenPath = target
    return { path: target, name: path.basename(target), text }
  })

  // 화면에서 불러온 파일을 정상적으로 반영했으면, 앞으로 그 파일에 저장
  ipcMain.handle('budget-file:confirm-open', async () => {
    if (!pendingOpenPath) return false
    await writeSettings({ lastFilePath: pendingOpenPath })
    pendingOpenPath = null
    return true
  })
}

// ----- 창 만들기 -----
function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 720,
    minHeight: 520,
    title: '가계부',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0d0e10',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  // 외부 링크/새 창 열기 막기
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = devServerUrl ? url.startsWith(devServerUrl) : url.startsWith('file://')
    if (!allowed) event.preventDefault()
  })

  // 개발 모드에서는 F12 로 개발자 도구
  if (devServerUrl) {
    win.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        win.webContents.toggleDevTools()
        event.preventDefault()
      }
    })
  }

  if (devServerUrl) {
    win.loadURL(devServerUrl)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  return win
}

// 앱은 하나만 실행 (두 번 실행하면 기존 창을 앞으로)
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })

  // 작업 표시줄에서 설치된 바로가기와 같은 앱으로 묶이도록 (package.json build.appId 와 같게)
  if (process.platform === 'win32') app.setAppUserModelId('com.budgetbook.app')

  app.whenReady().then(() => {
    nativeTheme.themeSource = 'dark' // 윈도우 제목 표시줄도 어둡게
    Menu.setApplicationMenu(null)
    registerFileHandlers()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
