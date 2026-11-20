// 로그인 계정 (고정값)
const ACCOUNT = {
  id: 'admin',
  password: '1234',
}

export function checkLogin(id, password) {
  return id === ACCOUNT.id && password === ACCOUNT.password
}
