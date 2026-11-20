// 개발용 실행: Vite 개발 서버를 켜고, 그 주소로 Electron 창을 띄운다.
// 코드를 고치면 창에 바로 반영된다. (npm run app:dev)
import { spawn } from 'node:child_process'
import electronPath from 'electron'
import { createServer } from 'vite'

const server = await createServer({ server: { port: 5199 } })
await server.listen()

const url = server.resolvedUrls?.local?.[0] ?? `http://localhost:${server.config.server.port}/`
console.log(`\n  Vite 개발 서버: ${url}\n  Electron 창을 엽니다...\n`)

const electron = spawn(electronPath, ['.', `--dev-server=${url}`], { stdio: 'inherit' })

electron.on('close', async (code) => {
  await server.close()
  process.exit(code ?? 0)
})

process.on('SIGINT', () => electron.kill())
process.on('SIGTERM', () => electron.kill())
