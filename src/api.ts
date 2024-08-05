import { cache, redirect } from "@solidjs/router"
import axios from "axios"
import { getRequestEvent, isServer } from "solid-js/web"

let accessToken: string | undefined

const refreshTokenExists = () => {
  if (isServer) {
    console.log(getRequestEvent()?.request.headers)
    return false
  }
  return document.cookie.indexOf("refreshtokenkey=") !== -1
}

const apiConfig = () =>
  accessToken
    ? {
        baseURL: "https://shop-dev-api.kalamandi.ru/v1/",
        headers: {
          Authorization: accessToken,
        },
      }
    : { baseURL: "https://shop-dev-api.kalamandi.ru/v1/" }

async function assertAuth() {
  if (!accessToken) return await refreshTokens()
}

async function refreshTokens() {
  // if (!refreshTokenExists()) throw redirect("/lk/login")
  const resp = await axios.post<{ access_token: string }>("/auth/refresh-tokens", undefined, apiConfig())
  console.log(resp.data)
  accessToken = resp.data.access_token
}

export async function tryLogin(email: string, password: string) {
  // try {
  //   const resp = await axios.post<
  //     | {
  //         success: false
  //         error: { code: string }
  //       }
  //     | {
  //         access_token: string
  //       }
  //   >("/auth/login/email", { email, password }, apiConfig())
  //   if ("access_token" in resp.data) {
  //     console.log(resp.data)
  //     accessToken = resp.data.access_token
  //     return true
  //   } else return resp.data.error.code
  // } catch (e: unknown) {
  //   return false
  // }
  refreshTokens()
}

export const getShops = cache(async () => {
  await assertAuth()
  try {
    const resp = await axios.get<{
      result: {
        id: number
        name: string
        picture: string
        link: string
        support_url: string
      }[]
    }>("/project/my", apiConfig())
    return resp.data.result
  } catch (e: unknown) {
    throw new Error("Failed to GET /project/my")
  }
}, "shops")

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
