import { createMiddleware } from "@solidjs/start/middleware"
import { refreshTokens } from "./api"
import { getRequestEvent } from "solid-js/web"

export let serverAccessToken: string

export default createMiddleware({
  onRequest: [
    async event => {
      //   const path = new URL(event.request.url).pathname
      //   if (path.startsWith("/lk") && !path.startsWith("/lk/register") && !path.startsWith("/lk/login")) {
      //     console.log("processing request: getting access token")
      //     serverAccessToken = await refreshTokens()
      //   }
    },
  ],
})
