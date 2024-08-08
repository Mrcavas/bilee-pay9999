import { Checkbox } from "@ark-ui/solid"
import { MainLayout } from "~/app"
import Icon from "~/components/icon"
import Input from "~/components/input"
import checkboxBg from "~/assets/checkbox-bg.svg"
import checkboxMarked from "~/assets/checkbox-marked.svg"

function CheckBox() {
  return (
    <Checkbox.Root class="flex flex-row items-center gap-2" onCheckedChange={console.log}>
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
      <Checkbox.Label>Checkbox</Checkbox.Label>
      <Checkbox.HiddenInput />
    </Checkbox.Root>
  )
}

export default function Index() {
  return (
    <MainLayout>
      <CheckBox />
      <Input name="adadsad" type="text" class="mt-2 w-96" />
    </MainLayout>
  )
}
