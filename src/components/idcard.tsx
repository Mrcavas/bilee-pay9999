import { JSX } from "solid-js"
import { twMerge } from "tailwind-merge"
import success from "~/assets/success.svg"

type IdCardProps = {
  class: JSX.IntrinsicElements["div"]["class"]
  avatar: string
  title: string
  subtitle: string
}

export default function IdCard(props: IdCardProps) {
  return (
    <div
      class={twMerge(
        "flex w-full flex-row items-center justify-between rounded-content bg-success/30 px-3 py-2",
        props.class
      )}>
      <div class="flex flex-row items-center gap-2">
        <img src={props.avatar} class="h-10 w-10 rounded-full" />
        <div class="flex flex-col">
          <span class="text-card font-semibold">{props.title}</span>
          <span class="text-xs">{props.subtitle}</span>
        </div>
      </div>
      <img src={success} class="h-[23px] w-[23px]" />
    </div>
  )
}
