import { Tabs } from "@ark-ui/solid"
import { RouteSectionProps } from "@solidjs/router"
import { Show, createEffect, createSignal, onMount } from "solid-js"
import BotTab from "./(bot)"
import PaymentTab from "./(payment)"
import APITab from "./(api)"
import MethodsTab from "./(methods)"
import { createAPIResource, getShops } from "~/api"
import { Title } from "@solidjs/meta"

export default function Shop(props: RouteSectionProps) {
  const tabsRefs: Record<string, HTMLButtonElement> = {}
  const [tab, setTab] = createSignal("bot")
  const shops = createAPIResource(getShops)
  const [selectedPath, setSelectedPath] = createSignal(props.params.shopPath)
  const selectedShop = () => shops()?.find(shop => shop.link === selectedPath())

  createEffect(() => props.params.shopPath && setSelectedPath(props.params.shopPath))

  onMount(() => {
    let hash = props.location.hash.slice(1)
    if (["bot", "methods", "payment", "api"].includes(hash)) setTab(hash)
  })

  return (
    <Show when={selectedShop()}>
      <Title>{selectedShop()!.name}</Title>
      <div class="overflow-hidden rounded-card bg-fg">
        <Tabs.Root
          value={tab()}
          onValueChange={({ value }) => {
            setTab(value)
            tabsRefs[value].scrollIntoView({ behavior: "smooth", inline: "center" })
            history.replaceState(undefined, "", `#${value}`)
          }}>
          <Tabs.List class="scrollbar-hide relative flex w-full flex-row justify-between gap-6 overflow-x-auto px-9 pb-1.5 pt-2 text-sm font-semibold *:scroll-mx-10 sm:px-10">
            <Tabs.Indicator class="top-0 h-0.5 w-[calc(var(--width)+18px)] translate-x-[-9px] rounded-b-full bg-primary" />
            <Tabs.Trigger ref={tabsRefs.bot} value="bot" class="shrink-0">
              Основное
            </Tabs.Trigger>
            <Tabs.Trigger ref={tabsRefs.methods} value="methods" class="shrink-0">
              Способы оплаты
            </Tabs.Trigger>
            <Tabs.Trigger ref={tabsRefs.payment} value="payment" class="shrink-0">
              Страница оплаты
            </Tabs.Trigger>
            <Tabs.Trigger ref={tabsRefs.api} value="api" class="shrink-0">
              API
            </Tabs.Trigger>
          </Tabs.List>
          <div class="p-4">
            <Tabs.Content value="bot">
              <BotTab project={selectedShop()!} />
            </Tabs.Content>
            <Tabs.Content value="methods">
              <MethodsTab project={selectedShop()!} />
            </Tabs.Content>
            <Tabs.Content value="payment">
              <PaymentTab project={selectedShop()!} />
            </Tabs.Content>
            <Tabs.Content value="api">
              <APITab project={selectedShop()!} />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </Show>
  )
}
