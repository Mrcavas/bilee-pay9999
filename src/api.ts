import { cache, createAsync, redirect, revalidate } from "@solidjs/router"
import axios from "axios"
import { getRequestEvent, isServer } from "solid-js/web"

const baseConfig = {
  baseURL: "https://mrcavas.bilee.ru/api/v1/",
  validateStatus: () => true,
}

const apiConfig = (authToken?: string) =>
  authToken
    ? {
        ...baseConfig,
        headers: {
          Authorization: authToken,
        },
      }
    : baseConfig

async function getAccessToken() {
  if (isServer) {
    return (async () => {
      "use server"
      return getRequestEvent()?.nativeEvent.context.accessToken
    })()
  } else if (!window.accessToken) return (window.accessToken = await refreshTokens())
  else {
    console.log("using accessToken from window.accessToken")
    return window.accessToken
  }
}

export async function refreshTokens() {
  const resp = await axios.post<{ success: false } | { access_token: string }>(
    "/auth/refresh-tokens",
    undefined,
    apiConfig()
  )
  if (!("access_token" in resp.data)) throw redirect("/lk/login")
  return resp.data.access_token
}

export async function tryLogin(email: string, password: string) {
  const resp = await axios.post<ApiResponse<{ access_token: string }>>(
    "/auth/login/email",
    { email, password },
    apiConfig()
  )
  if ("access_token" in resp.data) {
    window.accessToken = resp.data.access_token
    return true
  } else return resp.data.error.code
}

export async function logout() {
  const aT = await getAccessToken()
  await axios.post("/auth/logout", undefined, apiConfig(aT))
  window.accessToken = ""
}

export const getShops = cache(async () => {
  const aT = await getAccessToken()
  const resp = await axios.get<ApiResponse<{ result: Project[] }>>("/project/my", apiConfig(aT))
  if (resp.data.success) return resp.data.result
  throw new Error("Failed to getShops")
}, "shops")

export async function createApiKey(name: string) {
  await new Promise(r => setTimeout(r, 1000))
  return "new cool keey yeeeeah"
}

export async function createNewProject(supportUrl: string, path: string, token: string) {
  const aT = await getAccessToken()
  const resp = await axios.post<ApiResponse<{ result: Project }>>(
    "/project/create",
    {
      bot_token: token,
      support_url: supportUrl,
      link: path,
    },
    apiConfig(aT)
  )
  if (resp.data.success) revalidate("shops")
  return resp.data
}

export const createAPIResource = <T>(fn: () => Promise<T>) =>
  createAsync(() => fn(), {
    deferStream: true,
  })
