import { JSX } from "solid-js"
import Icon from "./icon"
import { twMerge } from "tailwind-merge"

export default function IconDisplay(props: { icon: Icon } & JSX.IntrinsicElements["div"]) {
  return <Icon {...props} icon={props.icon.url} colored={props.icon.colored} class={twMerge("bg-text", props.class)} />
}
