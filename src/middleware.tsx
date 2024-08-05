import { createMiddleware } from "@solidjs/start/middleware"
import axios from "axios"

export default createMiddleware({
  onRequest: [
    async event => {
      const path = new URL(event.request.url).pathname
      if (path.startsWith("/lk") && !path.startsWith("/lk/register") && !path.startsWith("/lk/login")) {
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
        if (!("access_token" in resp.data)) return Response.redirect("https://mrcavas.bilee.ru/lk/login")
        if (resp.headers["set-cookie"]) event.response.headers.set("Set-Cookie", resp.headers["set-cookie"][0])
        event.nativeEvent.context.accessToken = resp.data.access_token
      }
    },
  ],
})
