// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server"
import { getRequestEvent } from "solid-js/web"

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" class="dark:dark-colors h-full w-full">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/bilee.svg" />
          {assets}
        </head>
        <body class="h-full w-full">
          <div id="app" class="h-full w-full">
            {children}
          </div>
          <script>{`window.accessToken = "${getRequestEvent()?.nativeEvent.context.accessToken ?? ""}"`}</script>
          {scripts}
        </body>
      </html>
    )}
  />
))
