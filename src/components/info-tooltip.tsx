import { Tooltip } from "@ark-ui/solid"
import { createSignal, ParentProps } from "solid-js"
import { Portal } from "solid-js/web"
import help from "~/assets/help.svg"
import Icon from "./icon"

export default function InfoTooltip(props: ParentProps) {
  const [isTooltipShown, setTooltipShown] = createSignal(false)

  return (
    <Tooltip.Root
      closeDelay={0}
      openDelay={0}
      open={isTooltipShown()}
      positioning={{ placement: "top-end", offset: { crossAxis: -18, mainAxis: -6 } }}>
      <Tooltip.Trigger
        asChild={props => (
          <button
            class="cursor-help rounded-full"
            {...props}
            onMouseOver={() => setTooltipShown(true)}
            onMouseOut={() => setTooltipShown(false)}
            onTouchStart={() => setTooltipShown(prev => !prev)}>
            <Icon icon={help} class="-m-0.5 h-7 w-7 rounded-full bg-primary" />
          </button>
        )}
      />
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content class="z-20 max-w-64 overflow-hidden rounded-card bg-fg px-[1.125rem] py-4 shadow-menu focus:outline-none sm:max-w-80">
            {props.children}
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  )
}
