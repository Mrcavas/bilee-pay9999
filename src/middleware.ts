import { createMiddleware } from "@solidjs/start/middleware"
import axios from "axios"
import { getCookie } from "vinxi/http"

export default createMiddleware({
  onRequest: [
    async event => {
      const path = new URL(event.request.url).pathname
      if (path.startsWith("/lk")) {
        const accessTokenCookie = getCookie(event.nativeEvent, "accesstokenkey")
        if (accessTokenCookie) {
          event.nativeEvent.context.accessToken = accessTokenCookie
          event.response.headers.append(
            "Set-Cookie",
            'accesstokenkey=""; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          )
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
        if (path.startsWith("/lk/register") || path.startsWith("/lk/login")) {
          if (!("access_token" in resp.data)) return

          const headers = new Headers()
          headers.append("Set-Cookie", `accesstokenkey="${resp.data.access_token}"; HttpOnly; Path=/`)
          resp.headers["set-cookie"]?.forEach(cookie => headers.append("Set-Cookie", cookie))

          headers.append("Location", "https://mrcavas.bilee.ru/lk")
          return new Response(null, { status: 302, headers })
        }
        if (!("access_token" in resp.data)) return Response.redirect("https://mrcavas.bilee.ru/lk/login")
        resp.headers["set-cookie"]?.forEach(cookie => event.response.headers.append("Set-Cookie", cookie))
        event.nativeEvent.context.accessToken = resp.data.access_token
      }
    },
  ],
})
