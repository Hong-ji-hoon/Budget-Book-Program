import { useRef, useState } from 'react'
import { checkLogin } from '../auth'
import { AlertIcon, EyeIcon, EyeOffIcon, WalletIcon } from '../components/Icons'
import './LoginPage.css'

function LoginPage({ onLogin }) {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // error: { message, fields: ['id' | 'password'] } 또는 null
  const [error, setError] = useState(null)
  const [errorCount, setErrorCount] = useState(0)
  const idRef = useRef(null)
  const passwordRef = useRef(null)

  function fail(message, fields, focusTarget) {
    setError({ message, fields })
    setErrorCount((count) => count + 1)
    focusTarget.current?.focus()
  }

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedId = id.trim()

    if (!trimmedId) {
      fail('아이디를 입력해 주세요.', ['id'], idRef)
      return
    }
    if (!password) {
      fail('비밀번호를 입력해 주세요.', ['password'], passwordRef)
      return
    }
    if (!checkLogin(trimmedId, password)) {
      setPassword('')
      fail('아이디 또는 비밀번호가 올바르지 않습니다.', ['id', 'password'], passwordRef)
      return
    }

    setError(null)
    onLogin()
  }

  const isInvalid = (field) => error?.fields.includes(field) ?? false

  return (
    <div className="login">
      <main className="login__card">
        <header className="login__header">
          <div className="login__logo">
            <WalletIcon />
          </div>
          <h1 className="login__title">가계부</h1>
        </header>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="login-id">
              아이디
            </label>
            <input
              ref={idRef}
              id="login-id"
              className="field__input"
              type="text"
              value={id}
              onChange={(event) => {
                setId(event.target.value)
                setError(null)
              }}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              autoFocus
              aria-invalid={isInvalid('id')}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="login-password">
              비밀번호
            </label>
            <div className="field__control">
              <input
                ref={passwordRef}
                id="login-password"
                className="field__input field__input--with-action"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError(null)
                }}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                aria-invalid={isInvalid('password')}
              />
              <button
                type="button"
                className="field__action"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="login__message" aria-live="polite">
            {error && (
              <p key={errorCount} className="login__error" role="alert">
                <AlertIcon />
                {error.message}
              </p>
            )}
          </div>

          <button type="submit" className="login__submit">
            로그인
          </button>
        </form>
      </main>
    </div>
  )
}

export default LoginPage
