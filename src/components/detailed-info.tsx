import {
  Accessor,
  Component,
  createRenderEffect,
  createSignal,
  JSX,
  onMount,
  ParentComponent,
  splitProps,
} from "solid-js"
import { twMerge } from "tailwind-merge"

type DetailedInfoProps = {
  trigger: (isOpen: Accessor<boolean>) => JSX.Element
  triggerClass?: JSX.IntrinsicElements["div"]["class"]
}

const DetailedInfo: ParentComponent<DetailedInfoProps & JSX.IntrinsicElements["div"]> = props => {
  const [local, divProps] = splitProps(props, ["trigger", "triggerClass"])
  const [isOpen, setOpen] = createSignal(false)
  const [infoState, setInfoState] = createSignal<number | "hidden" | "layout-show">("hidden")

  const info = (
    <div
      class={twMerge("overflow-hidden transition-all", infoState() === "hidden" && "hidden")}
      style={{
        "max-height": isOpen() ? `${infoState()!}px` : infoState() == "layout-show" ? undefined : 0,
      }}>
      {props.children}
    </div>
  )

  onMount(() => setInfoState("layout-show"))

  createRenderEffect(() => {
    if (infoState() === "layout-show") setInfoState((info as HTMLDivElement).offsetHeight + 1)
  })

  return (
    <div {...divProps}>
      <button onClick={() => setOpen(!isOpen())} class={local.triggerClass}>
        {local.trigger(isOpen)}
      </button>
      {info}
    </div>
  )
}

export default DetailedInfo
