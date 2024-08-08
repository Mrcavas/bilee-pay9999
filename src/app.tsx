import { Router } from "@solidjs/router"
import { FileRoutes } from "@solidjs/start/router"
import { createSignal, ErrorBoundary, JSX, ParentProps, Show, splitProps, Suspense } from "solid-js"
import "./app.css"
import LegalFooter from "./components/legal-footer"
import Error from "./routes/(error)"
import { twMerge } from "tailwind-merge"

export default function App() {
  return (
    <Router root={Root}>
      <FileRoutes />
    </Router>
  )
}

function Root(props: ParentProps) {
  return (
    <Suspense>
      <main id="main" class="scrollbar-hide h-full w-full overflow-auto">
        <ErrorBoundary fallback={Error}>{props.children}</ErrorBoundary>
      </main>
    </Suspense>
  )
}

export function MainLayout(
  props: ParentProps<JSX.IntrinsicElements["div"]> & { dontCenter?: boolean; noFooter?: boolean }
) {
  const [_, divProps] = splitProps(props, ["children", "dontCenter", "noFooter"])

  return (
    <>
      <div class={"flex min-h-full flex-col items-center text-base" + (props.dontCenter ? "" : " sm:justify-around")}>
        <div {...divProps} class={twMerge("flex w-full max-w-[750px] flex-col p-4", props.class)}>
          {props.children}
        </div>
      </div>
    </>
  )
}
