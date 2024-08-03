import { JSX, ParentProps, Show, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import Icon from "./icon"
import spinner from "~/assets/spinner.svg"

type ButtonProps = {
  loading?: boolean
}

export default function Button(props: ButtonProps & ParentProps<JSX.IntrinsicElements["button"]>) {
  const [_, buttonProps] = splitProps(props, ["loading"])

  return (
    <button
      {...buttonProps}
      class={twMerge(
        "flex w-full flex-row items-center justify-center rounded-content bg-primary py-4 text-base font-semibold text-text-on-primary transition-opacity",
        props.disabled && "opacity-60",
        props.class
      )}>
      <Show when={props.loading} fallback={props.children}>
        <Icon icon={spinner} class="h-[1.2em] w-[1.2em] bg-text-on-primary" />
      </Show>
    </button>
  )
}
