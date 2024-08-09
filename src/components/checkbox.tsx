import { Checkbox } from "@ark-ui/solid"
import Icon from "~/components/icon"
import checkboxBg from "~/assets/checkbox-bg.svg"
import checkboxMarked from "~/assets/checkbox-marked.svg"

export function CheckBox(props: { name: string; checked?: boolean; onCheck?: (val: boolean) => void }) {
  return (
    <Checkbox.Root
      checked={props.checked}
      class="flex flex-row items-center gap-2"
      onCheckedChange={({ checked }) => props.onCheck?.(checked as boolean)}>
      <Checkbox.Control class="group relative">
        <Icon
          icon={checkboxBg}
          class="h-8 w-8 bg-hint2/15 transition-colors duration-100 group-data-[focus]:bg-text/10"
        />
        <Checkbox.Indicator
          asChild={props => (
            <Icon
              icon={checkboxMarked}
              class="absolute left-0 top-0 !block h-8 w-8 transition-colors duration-100 data-[state=checked]:bg-primary"
              {...props}
            />
          )}
        />
      </Checkbox.Control>
      <Checkbox.Label>{props.name}</Checkbox.Label>
      <Checkbox.HiddenInput />
    </Checkbox.Root>
  )
}
