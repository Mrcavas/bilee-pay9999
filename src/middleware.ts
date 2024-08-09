import { createMiddleware } from "@solidjs/start/middleware"
import axios from "axios"
import { getCookie, sendWebResponse } from "vinxi/http"

export default createMiddleware({
  onRequest: async event => {
    const path = new URL(event.request.url).pathname

    if (path.startsWith("/lk/") || path === "/lk") {
      const accessTokenCookie = getCookie(event.nativeEvent, "accesstokenkey")
      if (accessTokenCookie) {
        event.nativeEvent.context.accessToken = accessTokenCookie
        event.response.headers.append("Set-Cookie", 'accesstokenkey=""; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT')
        return
      }
      const resp = await axios.post<{ success: false } | { access_token: string }>(
        "https://mrcavas.bilee.ru/api/v1/auth/refresh-tokens",
        undefined,
        {
          headers: {
            Cookie: event.request.headers.get("cookie"),
          },
          validateStatus: () => true,
        }
      )
      if (!("access_token" in resp.data)) return

      resp.headers["set-cookie"]?.forEach(cookie => event.response.headers.append("Set-Cookie", cookie))
      event.nativeEvent.context.accessToken = resp.data.access_token
      event.nativeEvent.context.origCookies = resp.headers["set-cookie"]
    }
  },
  onBeforeResponse: async event => {
    const path = new URL(event.request.url).pathname

    if (path.startsWith("/lk/") || path === "/lk") {
      if (path.startsWith("/lk/register") || path.startsWith("/lk/login")) {
        if (!event.nativeEvent.context.accessToken) return

        const headers = new Headers()
        headers.append("Set-Cookie", `accesstokenkey="${event.nativeEvent.context.accessToken}"; HttpOnly; Path=/`)
        ;(event.nativeEvent.context.origCookies as string[])?.forEach(cookie => headers.append("Set-Cookie", cookie))

        headers.append("Location", "https://mrcavas.bilee.ru/lk")
        await sendWebResponse(new Response(null, { status: 302, headers }))
        return
      }
      if (!event.nativeEvent.context.accessToken) {
        await sendWebResponse(Response.redirect("https://mrcavas.bilee.ru/lk/login"))
        return
      }
    }
  },
})
