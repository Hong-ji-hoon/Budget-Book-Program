// ===== 화면(React) ↔ Electron 연결 =====
// 화면에서는 window.budgetFile 로 파일 저장/불러오기를 쓸 수 있다.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('budgetFile', {
  readLast: () => ipcRenderer.invoke('budget-file:read-last'),
  save: (text, options = {}) => ipcRenderer.invoke('budget-file:save', { text, saveAs: Boolean(options.saveAs) }),
  open: () => ipcRenderer.invoke('budget-file:open'),
  confirmOpen: () => ipcRenderer.invoke('budget-file:confirm-open'),
})
