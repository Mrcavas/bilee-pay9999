import { Menu } from "@ark-ui/solid"
import { createAsync, RouteSectionProps, useLocation, useNavigate, useParams } from "@solidjs/router"
import { createEffect, For, Show } from "solid-js"
import { getShops } from "~/api"
import { MainLayout } from "~/app"
import arrow from "~/assets/arrow.svg"
import check from "~/assets/check.svg"
import logout from "~/assets/logout.svg"
import Broadcast from "~/components/broadcast"
import { GoCardInsides } from "~/components/gocard"
import Icon from "~/components/icon"
import { SHOPS } from "~/mocked-data"

export default function LK(props: RouteSectionProps) {
  const shops = createAsync(() => getShops())
  const location = useLocation()
  const navigate = useNavigate()
  const selectedShopId = () => (props.params.shopId ? +props.params.shopId : undefined)
  const selectedShop = () => (selectedShopId() ? shops()!.find(shop => shop.id === selectedShopId()) : undefined)

  return (
    <MainLayout dontCenter class="gap-4">
      <div class="flex flex-row justify-between rounded-card bg-fg px-4 py-3.5">
        <button class="flex flex-row items-center gap-[12px] rounded-full" onClick={() => navigate("/lk")}>
          <Show when={location.pathname.includes("shop")}>
            <Icon icon={arrow} class="h-6 w-6 shrink-0 bg-text" />
          </Show>
          <div class="flex h-10 shrink flex-row items-center gap-2 pl-0.5 pr-2">
            <img src="/bilee.svg" class="h-9" />
            <div class="max-w-[max(0px,calc((100%-98px)*100))] overflow-hidden font-semibold">
              <span class="text-primary max-sm:hidden">Bilee </span>Bots
            </div>
          </div>
        </button>
        <Show
          when={location.pathname.includes("shop")}
          fallback={
            <div class="flex flex-row items-center gap-3">
              <span class="text-card underline underline-offset-2">ptanyuk01</span>
              <Icon icon={logout} class="h-6 w-6 bg-text" />
            </div>
          }>
          <Menu.Root
            positioning={{ placement: "bottom-end", offset: { crossAxis: 12 } }}
            onSelect={id => {
              if (+id !== selectedShop()?.id) navigate(`/lk/shop/${id.value}`, { replace: true })
            }}>
            <Menu.Trigger class="flex max-w-full flex-row items-center overflow-hidden rounded-full">
              <img src={selectedShop()?.picture} class="mr-3 h-10 w-10 shrink-0 rounded-full" />
              <div class="flex shrink flex-col overflow-hidden text-left">
                <span class="overflow-hidden overflow-ellipsis whitespace-nowrap break-all text-card font-semibold">
                  {selectedShop()?.name}
                </span>
                <span class="overflow-hidden overflow-ellipsis whitespace-nowrap break-all text-xs">
                  @{selectedShop()?.link}
                </span>
              </div>
              <Icon icon={arrow} class="ml-4 h-6 w-6 shrink-0 -rotate-90 bg-text" />
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content class="z-10 overflow-hidden rounded-card bg-fg p-3 shadow-menu focus:outline-none">
                <div class="px-2 py-1 text-sm">Сменить магазин</div>
                <For each={SHOPS}>
                  {shop => (
                    <Menu.Item
                      value={shop.id.toString()}
                      class="flex cursor-pointer flex-row items-center gap-3 rounded-[18px] p-2 data-[highlighted]:bg-text/10">
                      <GoCardInsides
                        icon={<img src={shop.icon} class="h-10 w-10 rounded-full" />}
                        title={shop.name}
                        description={shop.description}
                        noArrow>
                        <Show when={selectedShop()?.id === shop.id}>
                          <Icon icon={check} class="h-6 w-6 bg-text" />
                        </Show>
                      </GoCardInsides>
                    </Menu.Item>
                  )}
                </For>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </Show>
      </div>
      <Broadcast type="error">Походу мы обосрались</Broadcast>
      {props.children}
    </MainLayout>
  )
}
