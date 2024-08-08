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
  } else {
    if (!window.accessToken) window.accessToken = await refreshTokens()
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

export async function tryRegister(email: string, password: string) {
  const resp = await axios.post<ApiResponse<{ access_token: string }>>(
    "/auth/register/email",
    { email, password, password_repeat: password },
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

export const getMe = cache(async () => {
  const aT = await getAccessToken()
  const resp = await axios.get<ApiResponse<{ result: { email: string } }>>("/user/me", apiConfig(aT))
  if (resp.data.success) return resp.data.result
  throw new Error("getMe failed")
}, "me")

export const getShops = cache(async () => {
  const aT = await getAccessToken()
  const resp = await axios.get<ApiResponse<{ result: Project[] }>>("/project/my", apiConfig(aT))
  if (resp.data.success) return resp.data.result
  throw new Error("getShops failed")
}, "shops")

let icons: Icon[] | undefined
export const getIcons = cache(async () => {
  if (icons) return icons
  const aT = await getAccessToken()
  const resp = await axios.get<ApiResponse<{ result: Icon[] }>>("/payment-method/icons", apiConfig(aT))
  if (resp.data.success) {
    icons = resp.data.result
    return resp.data.result
  }
  throw new Error("getIcons failed")
}, "icons")

let paymentSystems: PaymentSystem[] | undefined
export const getPaymentSystems = cache(async () => {
  if (paymentSystems) return paymentSystems
  const aT = await getAccessToken()
  const resp = await axios.get<ApiResponse<{ result: PaymentSystem[] }>>("/payment-system/available", apiConfig(aT))
  if (resp.data.success) {
    paymentSystems = resp.data.result
    return resp.data.result
  }
  throw new Error("getPaymentSystems failed")
}, "payment-systems")

export async function createApiKey(projectId: number, name: string) {
  const resp = await axios.post<ApiResponse<{ result: { token: string } }>>(
    `/project/${projectId}/token/create`,
    { name },
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) return resp.data.result
  throw new Error("createApiKey failed")
}

export async function refreshApiKey(projectId: number) {
  const resp = await axios.post<ApiResponse<{ result: { token: string } }>>(
    `/project/${projectId}/token/refresh`,
    undefined,
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) return resp.data.result
  throw new Error("refreshApiKey failed")
}

export async function deleteApiKey(projectId: number) {
  const resp = await axios.delete<ApiResponse<{}>>(`/project/${projectId}/token`, apiConfig(await getAccessToken()))
  if (resp.data.success) return
  throw new Error("deleteApiKey failed")
}

export const getApiKey = async (projectId: number): Promise<{} | ApiKey> => {
  const resp = await axios.get<ApiResponse<{ result: ApiKey }>>(
    `/project/${projectId}/token`,
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) return resp.data.result
  else return {}
}

export async function createNewProject(supportUrl: string, path: string, token: string) {
  const resp = await axios.post<ApiResponse<{ result: Project }>>(
    "/project/create",
    {
      bot_token: token,
      support_url: supportUrl,
      link: path,
    },
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) revalidate("shops")
  return resp.data
}

export async function deleteProject(projectId: number) {
  const resp = await axios.delete<ApiResponse<{}>>(`/project/${projectId}`, apiConfig(await getAccessToken()))
  revalidate("shops")
  if (resp.data.success) return
  throw new Error("deleteProject failed")
}

export const createAPIResource = <T>(fn: () => Promise<T>) =>
  createAsync(() => fn(), {
    deferStream: true,
  })

export const updateSupportUrl = (projectId: number) => async (support_url: string) => {
  const resp = await axios.post<ApiResponse<{ result: Project }>>(
    `/project/${projectId}/update`,
    { support_url },
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) revalidate("shops")
  return resp.data.success
}

export const updateFooterText = (projectId: number) => async (footer_text: string) => {
  const resp = await axios.post<ApiResponse<{ result: Project }>>(
    `/project/${projectId}/update`,
    { footer_text },
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) revalidate("shops")
  return resp.data.success
}

export const updateWebhookUrl = (projectId: number) => async (notify_url: string) => {
  const resp = await axios.post<ApiResponse<{ result: Project }>>(
    `/project/${projectId}/update`,
    { notify_url },
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) revalidate("shops")
  return resp.data.success
}

export const getPaymentMethods = async (projectId: number) => {
  const resp = await axios.get<ApiResponse<{ result: PaymentMethod[] }>>(
    `/payment-method/${projectId}/methods`,
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) return resp.data.result
  else return []
}

export async function deletePaymentMethod(projectId: number, methodId: number) {
  const resp = await axios.delete<ApiResponse<{}>>(
    `/payment-method/${projectId}/${methodId}`,
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) return
  throw new Error("deletePaymentMethod failed")
}

export async function createPaymentMethod(projectId: number, method: PaymentMethodCreate) {
  const resp = await axios.post<ApiResponse<{ result: PaymentMethod }>>(
    `/payment-method/${projectId}/create`,
    method,
    apiConfig(await getAccessToken())
  )
  return resp.data
}

export async function updatePaymentMethod(projectId: number, methodId: number, method: PaymentMethodCreate) {
  const resp = await axios.post<ApiResponse<{ result: PaymentMethod }>>(
    `/payment-method/${projectId}/${methodId}/update`,
    method,
    apiConfig(await getAccessToken())
  )
  return resp.data
}

export async function updateMethodPositions(
  projectId: number,
  methods: { id: number; position_index: number; primary: boolean }[]
) {
  const resp = await axios.post<ApiResponse<{}>>(
    `/payment-method/${projectId}/update-position`,
    methods,
    apiConfig(await getAccessToken())
  )
  if (resp.data.success) return
  throw new Error("updateMethodPositions failed")
}

export const getProjectInfo = cache(async (projectLink: string) => {
  const resp = await axios.get<ApiResponse<{ result: Project }>>(`/project/info/ulk/${projectLink}`, baseConfig)
  if (resp.data.success) {
    const resp2 = await axios.get<ApiResponse<{ result: PaymentMethod[] }>>(
      `/payment-method/${resp.data.result.id}/available`,
      baseConfig
    )
    if (resp2.data.success)
      return {
        success: true,
        ...resp.data.result,
        methods: resp2.data.result,
      } as Project & {
        success: true, 
        methods: PaymentMethod[]
      }
    return resp2.data
  }
  return resp.data
}, "project-info")
