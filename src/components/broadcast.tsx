import { Match, ParentProps, Switch } from "solid-js"
import Icon from "./icon"
import info from "~/assets/info.svg"

export default function Broadcast(props: ParentProps & { type: "error" | "warning" | "success" }) {
  return <></>
  return (
    <div class={`flex w-full flex-row gap-4 bg-${props.type}/30 items-center rounded-card p-4`}>
      <div class="relative h-7 w-7 place-self-start overflow-hidden rounded-full">
        <div class="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 bg-white" />
        <Icon icon={info} class={`h-7 w-7 bg-${props.type}`} />
      </div>
      <div class="text-sm">{props.children}</div>
    </div>
  )
}
