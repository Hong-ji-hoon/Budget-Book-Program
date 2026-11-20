import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import MainPage from './pages/MainPage'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  return <MainPage onLogout={() => setIsLoggedIn(false)} />
}

export default App
