export async function createApiKey(name: string) {
  await new Promise(r => setTimeout(r, 1000))
  return "new cool keey yeeeeah"
}

export async function createNewProject(supportUrl: string, url: string, token: string) {
  await new Promise(r => setTimeout(r, 2000))
  return {
    id: 4,
  }
}

export async function tryLogin(email: string, password: string) {
  await new Promise(r => setTimeout(r, 2000))
  return email === "sidorov.mrcavas@mail.ru" && password === "12277903543"
}
