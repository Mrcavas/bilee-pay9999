import { Dialog } from "@ark-ui/solid"
import { createSignal, Match, Show, Switch } from "solid-js"
import { Portal } from "solid-js/web"
import { createApiKey } from "~/api"
import close from "~/assets/close.svg"
import keyIcon from "~/assets/key.svg"
import refresh from "~/assets/refresh.svg"
import spinner from "~/assets/spinner.svg"
import trash from "~/assets/trash.svg"
import add from "~/assets/add.svg"
import { GoCardBtn } from "~/components/gocard"
import Icon from "~/components/icon"
import Input from "~/components/input"
import { createDebouncedSaver, isValidUrl } from "~/utilities"
import Button from "~/components/button"

export default function APITab() {
  const [isWebhookInvalid, onWebhookInput, webhookIndicator] = createDebouncedSaver(isValidUrl, async v => {
    await new Promise(r => setTimeout(r, 1000))
    return true
  })
  const [isDialogLoading, setDialogLoading] = createSignal(false)
  const [isDialogOpen, setDialogOpen] = createSignal(false)
  const [generatedKey, setGeneratedKey] = createSignal<string | undefined>()
  const [name, setName] = createSignal<string | undefined>()
  const [key, setKey] = createSignal<{ name: string; display: string } | undefined>({
    name: "Key name",
    display: "ksc****RA1",
  })

  return (
    <>
      <div class="px-2 text-sm sm:text-card">
        <p>На данной странице доступны технические параметры Вашего магазина</p>
        <p>
          Настройте интеграцию с ботом следуя{" "}
          <a href="https://example.com/" class="underline underline-offset-2">
            нашей документации
          </a>
        </p>
      </div>
      <div class="mb-1 mt-4 px-2">Отправка уведомлений</div>
      <Input
        invalid={isWebhookInvalid()}
        type="text"
        name="Webhook URL"
        onInput={onWebhookInput}
        invalidDescription="Введите правильный URL"
        append={webhookIndicator}
      />
      <div class="mb-1 mt-3 px-2">API ключ</div>
      <Show
        when={key()}
        fallback={
          <button
            class="flex w-full flex-row items-center gap-2.5 rounded-content bg-primary px-5 py-4 font-semibold text-text-on-primary"
            onClick={() => setDialogOpen(true)}>
            <Icon icon={add} class="h-6 w-6 bg-text-on-primary" />
            Выпустить
          </button>
        }>
        <div class="scrollbar-hide flex w-full flex-row items-center justify-between gap-4 overflow-x-auto rounded-content bg-hint2/15 px-5 py-4">
          <div class="flex shrink-0 flex-row items-center gap-2.5">
            <Icon icon={keyIcon} class="h-6 w-6 bg-text" />
            <div class="font-semibold">{key()!.name}</div>
            <div class="text-sm">{key()!.display}</div>
          </div>
          <div class="flex shrink-0 flex-row gap-4 sm:gap-5">
            <button onClick={() => setDialogOpen(true)}>
              <Icon icon={refresh} class="h-6 w-6 bg-hint1" />
            </button>
            <button onClick={() => setKey()}>
              <Icon icon={trash} class="h-6 w-6 bg-hint1" />
            </button>
          </div>
        </div>
        <div class="mt-1 px-2 text-sm">Ключ нельзя посмотреть, только перевыпустить</div>
      </Show>
      <Dialog.Root
        closeOnInteractOutside={false}
        open={isDialogOpen()}
        onOpenChange={({ open }) => setDialogOpen(open)}
        onExitComplete={() => {
          setName()
          setDialogLoading(false)
          if (generatedKey()) navigator.clipboard?.writeText(generatedKey()!)
          setGeneratedKey()
        }}>
        <Portal>
          <Dialog.Backdrop class="fixed left-0 top-0 h-full w-full bg-hint1/15" />
          <Dialog.Positioner class="fixed left-0 top-0 flex h-full w-full flex-col items-center justify-center px-4 py-10">
            <Dialog.Content class="scrollbar-hide w-full max-w-[520px] overflow-y-auto rounded-card bg-fg p-4">
              <div class="mb-4 flex flex-row justify-between gap-4">
                <Dialog.Title class="ml-1.5 font-semibold">Создание ключа</Dialog.Title>
                <Dialog.CloseTrigger class="rounded-[8px]">
                  <Icon icon={close} class="h-6 w-6 bg-text" />
                </Dialog.CloseTrigger>
              </div>

              <Show
                when={generatedKey()}
                fallback={
                  <Input
                    type="text"
                    name="Название"
                    invalid={name() !== undefined && name()!.length === 0}
                    value={name() ?? ""}
                    onInput={setName}
                    class="mt-2"
                    disabled={isDialogLoading()}
                  />
                }>
                <div class="relative flex w-full flex-row justify-between rounded-content bg-hint2/15 px-[21px] pb-2 pt-6">
                  <div class="absolute top-1 text-sm text-hint2">Ключ:</div>
                  {generatedKey()}
                </div>
              </Show>

              <Button
                class="mt-4"
                loading={isDialogLoading()}
                disabled={!name()}
                onClick={async () => {
                  if (generatedKey()) return setDialogOpen(false)

                  setDialogLoading(true)
                  const key = await createApiKey(name()!)
                  setGeneratedKey(key)
                  setKey({
                    name: name()!,
                    display: `${key.slice(0, 3)}****${key.slice(-3)}`,
                  })
                  setDialogLoading(false)
                }}>
                <Show when={!isDialogLoading() && generatedKey()} fallback="Создать">
                  Скопировать и выйти
                </Show>
              </Button>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
