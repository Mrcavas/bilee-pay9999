import { Select } from "@ark-ui/solid"
import { createSignal, JSX } from "solid-js"
import { Index, Portal } from "solid-js/web"
import arrow from "~/assets/arrow.svg"
import check from "~/assets/check.svg"
import Icon from "./icon"

type SelectorProps = {
  name: string
  items: {
    value: string
    label: JSX.Element
  }[]
  defaultValue?: string
  onSelect?: (value: string) => void
}

export default function Selector(props: SelectorProps & Pick<JSX.IntrinsicElements["div"], "class">) {
  const [isOpen, setOpen] = createSignal(false)

  return (
    <Select.Root
      open={isOpen()}
      onOpenChange={({ open }) => setOpen(open)}
      items={props.items}
      positioning={{ sameWidth: true }}
      onValueChange={v => props.onSelect?.(v.value[0])}
      defaultValue={props.defaultValue ? [props.defaultValue] : undefined}
      class={props.class}>
      <Select.Control>
        <Select.Trigger class="flex w-full flex-row items-center justify-between gap-4 rounded-content bg-hint2/15 py-4 pl-[21px] pr-[18px] data-[placeholder-shown]:text-hint2">
          <Select.ValueText placeholder={props.name} />
          <Select.Indicator>
            <Icon
              icon={arrow}
              class={"h-6 w-6 bg-text transition-transform duration-150 " + (isOpen() ? "rotate-90" : "-rotate-90")}
            />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content class="z-10 overflow-hidden rounded-content bg-fg p-3 shadow-menu focus:outline-none">
          <Index each={props.items}>
            {item => (
              <Select.Item
                item={item()}
                class="flex cursor-pointer flex-row items-center justify-between gap-3 rounded-[8px] px-3 py-2 data-[highlighted]:bg-text/10">
                <Select.ItemText>{item().label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Icon icon={check} class="h-6 w-6 bg-text" />
                </Select.ItemIndicator>
              </Select.Item>
            )}
          </Index>
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  )
}
