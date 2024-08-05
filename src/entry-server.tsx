// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server"
// import { serverAccessToken } from "./middleware"

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
          {/* <script>
            window.accessToken = "
            {(() => {
              console.log(`serverAccess: ${serverAccessToken}`)
              return serverAccessToken ?? ""
            })()}
            "
          </script> */}
          {scripts}
        </body>
      </html>
    )}
  />
))
