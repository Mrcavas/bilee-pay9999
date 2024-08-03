import { A, AnchorProps } from "@solidjs/router"
import { JSX, ParentProps, Show, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import arrow from "~/assets/arrow.svg"
import Icon from "./icon"

type GoCardProps = {
  icon: JSX.Element
  title: string
  description?: string
  noArrow?: boolean
}

const goCardDefaultStyle = (props: GoCardProps) =>
  "flex flex-row gap-3 px-4 py-3.5 bg-fg items-center" + (props.noArrow ? "" : " pr-2")

export function GoCardInsides(props: ParentProps & GoCardProps) {
  return (
    <>
      {props.icon}
      <div class="flex flex-grow flex-col text-left">
        <Show when={props.description} fallback={<span class="py-[8.4px] font-semibold">{props.title}</span>}>
          <span class="font-semibold">{props.title}</span>
          <span class="text-xs">{props.description}</span>
        </Show>
      </div>
      {props.children}
    </>
  )
}

export function GoCardA(props: GoCardProps & AnchorProps) {
  const [localProps, domProps] = splitProps(props, ["title", "description", "icon", "noArrow"])

  return (
    <A {...domProps} class={twMerge(goCardDefaultStyle(localProps), props.class)}>
      <GoCardInsides {...localProps}>
        <Show when={!localProps.noArrow}>
          <Icon icon={arrow} class="h-6 w-6 rotate-180 bg-text" />
        </Show>
      </GoCardInsides>
    </A>
  )
}

export function GoCardBtn(props: GoCardProps & JSX.IntrinsicElements["button"]) {
  const [localProps, domProps] = splitProps(props, ["title", "description", "icon", "noArrow"])

  return (
    <button {...domProps} class={twMerge(goCardDefaultStyle(localProps), props.class)}>
      <GoCardInsides {...localProps}>
        <Show when={!localProps.noArrow}>
          <Icon icon={arrow} class="h-6 w-6 rotate-180 bg-text" />
        </Show>
      </GoCardInsides>
    </button>
  )
}
