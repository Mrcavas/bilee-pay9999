import { Dialog, Tooltip } from "@ark-ui/solid"
import { RouteSectionProps, useNavigate } from "@solidjs/router"
import { createSignal, Show } from "solid-js"
import { For, Portal } from "solid-js/web"
import { createNewProject } from "~/api"
import add from "~/assets/add.svg"
import botImg from "~/assets/bot.svg"
import close from "~/assets/close.svg"
import help from "~/assets/help.svg"
import spinner from "~/assets/spinner.svg"
import Button from "~/components/button"
import { GoCardA, GoCardBtn } from "~/components/gocard"
import Icon from "~/components/icon"
import InfoTooltip from "~/components/info-tooltip"
import Input from "~/components/input"
import { SHOPS } from "~/mocked-data"
import { areFieldsFilled, createValidatedField, isValidUrl } from "~/utilities"

export default function LK(props: RouteSectionProps) {
  const bot = () => <Icon icon={botImg} class="h-6 w-6 bg-text" />

  const [isOpen, setIsOpen] = createSignal(false)
  const supportUrl = createValidatedField<string>(isValidUrl, "")
  const url = createValidatedField<string>(isValidUrl, "")
  const token = createValidatedField<string>(s => !!s, "")
  const [isLoading, setLoading] = createSignal(false)
  const navigate = useNavigate()

  return (
    <div>
      <div class="mb-3 mt-3 px-4">Выберите магазин</div>
      <div class="flex flex-wrap gap-3">
        <For each={SHOPS}>
          {shop => (
            <GoCardA
              icon={bot()}
              description={shop.description}
              title={shop.name}
              href={`shop/${shop.id}`}
              class="flex-grow rounded-card"
            />
          )}
        </For>
        <Dialog.Root
          closeOnInteractOutside={false}
          onOpenChange={({ open }) => setIsOpen(open)}
          open={isOpen()}
          onExitComplete={() => {
            supportUrl.set("")
          }}>
          <Dialog.Trigger
            asChild={props => (
              <GoCardBtn
                icon={<Icon icon={add} class="h-6 w-6 bg-text-on-primary" />}
                title="Создать"
                class="flex-grow rounded-card bg-primary text-text-on-primary"
                noArrow
                {...props}
              />
            )}
          />
          <Portal>
            <Dialog.Backdrop class="fixed left-0 top-0 h-full w-full bg-hint1/15" />
            <Dialog.Positioner class="fixed left-0 top-0 flex h-full w-full flex-col items-center justify-center px-4 py-10">
              <Dialog.Content class="scrollbar-hide w-full max-w-[520px] overflow-y-auto rounded-card bg-fg p-4">
                <div class="mb-4 flex flex-row justify-between gap-4">
                  <Dialog.Title class="ml-1.5 font-semibold">Создать проект</Dialog.Title>
                  <Dialog.CloseTrigger class="rounded-[8px]">
                    <Icon icon={close} class="h-6 w-6 bg-text" />
                  </Dialog.CloseTrigger>
                </div>

                <Input {...supportUrl.inputProps()} type="text" name="Ссылка на поддержку" class="mt-2" />

                <Input
                  {...url.inputProps()}
                  type="text"
                  name="Уникальная ссылка на страницу"
                  class="mt-2"
                  append={
                    <InfoTooltip>
                      Ссылка на страницу, где будет происходить оплата. Пример:{" "}
                      <span class="font-semibold">https://o.bilee.ru/my_bot</span>
                    </InfoTooltip>
                  }
                />

                <Input
                  {...token.inputProps()}
                  type="text"
                  name="Токен Вашего бота"
                  class="mt-2"
                  append={<InfoTooltip>Используется для получения данных о пользователях магазина</InfoTooltip>}
                />

                <Button
                  class="mt-4"
                  loading={isLoading()}
                  disabled={!areFieldsFilled(supportUrl, url, token)}
                  onClick={async () => {
                    setLoading(true)
                    const { id } = await createNewProject(supportUrl()!, url(), token()!)
                    navigate(`/lk/shop/${id}`)
                    setLoading(false)
                  }}>
                  Создать
                </Button>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </div>
    </div>
  )
}
