import { Dialog, Tooltip } from "@ark-ui/solid"
import { RouteSectionProps, createAsync, useNavigate } from "@solidjs/router"
import { createSignal, Show } from "solid-js"
import { For, Portal } from "solid-js/web"
import { createAPIResource, createNewProject, getShops } from "~/api"
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
import { areFieldsFilled, createValidatedField, isValidPath, isValidUrl, resetFields } from "~/utilities"

export default function LK(props: RouteSectionProps) {
  const bot = () => <Icon icon={botImg} class="h-6 w-6 bg-text" />

  const shops = createAPIResource(getShops)
  const [isOpen, setIsOpen] = createSignal(false)
  const supportUrl = createValidatedField<string>(isValidUrl, "")
  const path = createValidatedField<string>(isValidPath, "")
  const token = createValidatedField<string>(s => !!s, "")
  const [isLoading, setLoading] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string>()
  const navigate = useNavigate()

  return (
    <div>
      <div class="mb-3 mt-3 px-4">Выберите магазин</div>
      <div class="flex flex-wrap gap-3">
        <For each={shops()}>
          {shop => (
            <GoCardA
              icon={bot()}
              description={`@${shop.url.substring(13)}`}
              title={shop.name}
              href={shop.link}
              class="flex-grow rounded-card"
            />
          )}
        </For>
        <Dialog.Root
          closeOnInteractOutside={false}
          onOpenChange={({ open }) => setIsOpen(open)}
          open={isOpen()}
          onExitComplete={() => {
            setErrorMessage()
            resetFields(supportUrl, path, token)
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
                <Show when={errorMessage()}>
                  <div class="-mt-2 w-full text-center text-sm text-error">{errorMessage()}</div>
                </Show>

                <Input {...supportUrl.inputProps()} type="text" name="Ссылка на поддержку" class="mt-2" />

                <Input
                  {...path.inputProps()}
                  type="text"
                  name="Уникальный путь страницы"
                  class="mt-2"
                  append={
                    <InfoTooltip>
                      Путь к странице, где будет происходить оплата. Пример: o.bilee.ru/
                      <span class="font-semibold">my_bot</span>
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
                  disabled={!areFieldsFilled(supportUrl, path, token)}
                  onClick={async () => {
                    setLoading(true)
                    const resp = await createNewProject(supportUrl()!, path(), token()!)
                    if (resp.success) navigate(`/lk/${resp.result.link}`)
                    else {
                      setLoading(false)
                      if (resp.error.code === "LINK_EXISTS") {
                        path.invalidate()
                        setErrorMessage("Выбранный путь уже существует")
                      } else {
                        setErrorMessage(resp.error.user_message)
                      }
                    }
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
