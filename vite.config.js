import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 빌드한 앱(Electron에서 여는 dist/index.html)에만 보안 정책(CSP)을 넣는다.
// 개발 서버는 코드 자동 반영 때문에 인라인 스크립트가 필요해서 제외.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')

function contentSecurityPolicy() {
  return {
    name: 'budget-book-csp',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  // Electron 앱은 빌드 결과(dist/index.html)를 파일로 직접 열기 때문에 상대 경로로 빌드
  base: './',
})
