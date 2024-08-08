import { Dialog } from "@ark-ui/solid"
import { writeClipboard } from "@solid-primitives/clipboard"
import { createAsync } from "@solidjs/router"
import { createEffect, createResource, createSignal, Match, Show, Switch } from "solid-js"
import { Portal } from "solid-js/web"
import { createApiKey, deleteApiKey, getApiKey, refreshApiKey, updateWebhookUrl } from "~/api"
import add from "~/assets/add.svg"
import close from "~/assets/close.svg"
import keyIcon from "~/assets/key.svg"
import refresh from "~/assets/refresh.svg"
import spinner from "~/assets/spinner.svg"
import trash from "~/assets/trash.svg"
import Button from "~/components/button"
import Icon from "~/components/icon"
import Input from "~/components/input"
import { createDebouncedSaver, isObjectEmpty, isValidUrl } from "~/utilities"

export default function APITab(props: { project: Project }) {
  let lastProjectId = props.project.id
  const webhookUrl = createDebouncedSaver(
    props.project.notify_url,
    v => isValidUrl(v) || v === "",
    updateWebhookUrl(props.project.id)
  )
  const [isDialogLoading, setDialogLoading] = createSignal(false)
  const [isDeleteLoading, setDeleteLoading] = createSignal(false)
  const [dialogType, setDialogType] = createSignal<"new" | "refresh">("new")
  const [isDialogOpen, setDialogOpen] = createSignal(false)
  const [generatedKey, setGeneratedKey] = createSignal<string | undefined>()
  const [name, setName] = createSignal<string | undefined>()
  const [key, setKey] = createSignal<{ name: string; display: string } | undefined>(undefined)
  const [apiKeyLoading, setApiKeyLoading] = createSignal(true)
  const token = createAsync(() => getApiKey(props.project.id), {
    deferStream: true,
  })

  createEffect(() => {
    const fetchedToken = token()
    if (!fetchedToken) return
    setApiKeyLoading(false)
    setKey(
      isObjectEmpty(fetchedToken)
        ? undefined
        : {
            name: (fetchedToken as ApiKey).name,
            display: (fetchedToken as ApiKey).protected_token,
          }
    )
  })

  createEffect(() => {
    if (props.project.id === lastProjectId) return
    webhookUrl.reset(props.project.notify_url, updateWebhookUrl(props.project.id))
    setApiKeyLoading(true)
    lastProjectId = props.project.id
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
      <Input type="text" name="Webhook URL" invalidDescription="Введите правильный URL" {...webhookUrl()} />
      <div class="mb-1 mt-3 px-2">API ключ</div>
      <Switch
        fallback={
          <div class="grid place-items-center p-3">
            <Icon icon={spinner} class="h-8 w-8 bg-text" />
          </div>
        }>
        <Match when={!key() && !apiKeyLoading()}>
          <button
            class="flex w-full flex-row items-center gap-2.5 rounded-content bg-primary px-5 py-4 font-semibold text-text-on-primary"
            onClick={() => setDialogType("new") && setDialogOpen(true)}>
            <Icon icon={add} class="h-6 w-6 bg-text-on-primary" />
            Выпустить
          </button>
        </Match>
        <Match when={key() && !apiKeyLoading()}>
          <div class="scrollbar-hide flex w-full flex-row items-center justify-between gap-4 overflow-x-auto rounded-content bg-hint2/15 px-5 py-4">
            <div class="flex shrink-0 flex-row items-center gap-2.5">
              <Icon icon={keyIcon} class="h-6 w-6 bg-text" />
              <div class="font-semibold">{key()!.name}</div>
              <div class="text-sm">{key()!.display}</div>
            </div>
            <div class="flex shrink-0 flex-row gap-4 sm:gap-5">
              <button
                onClick={async () => {
                  setDialogType("refresh")
                  setDialogOpen(true)
                  const { token } = await refreshApiKey(props.project.id)
                  setGeneratedKey(token)
                  setKey(prev => ({
                    name: prev!.name,
                    display: `${token.slice(0, 4)}***${token.slice(-4)}`,
                  }))
                }}>
                <Icon icon={refresh} class="h-6 w-6 bg-text" />
              </button>
              <Show when={!isDeleteLoading()} fallback={<Icon icon={spinner} class="h-6 w-6 bg-text" />}>
                <button
                  onClick={async () => {
                    setDeleteLoading(true)
                    await deleteApiKey(props.project.id)
                    setDeleteLoading(false)
                    setKey()
                  }}>
                  <Icon icon={trash} class="h-6 w-6 bg-text" />
                </button>
              </Show>
            </div>
          </div>
        </Match>
      </Switch>
      <div class="mt-1 px-2 text-sm">Ключ нельзя посмотреть, только перевыпустить</div>

      <Dialog.Root
        closeOnInteractOutside={false}
        open={isDialogOpen()}
        onOpenChange={({ open }) => dialogType() !== "refresh" && setDialogOpen(open)}
        onExitComplete={() => {
          setName()
          setDialogLoading(false)
          if (generatedKey()) writeClipboard(generatedKey()!)
          setGeneratedKey()
        }}>
        <Portal>
          <Dialog.Backdrop class="fixed left-0 top-0 h-full w-full bg-hint1/15" />
          <Dialog.Positioner class="fixed left-0 top-0 flex h-full w-full flex-col items-center justify-center px-4 py-10">
            <Dialog.Content class="scrollbar-hide w-full max-w-[520px] overflow-y-auto rounded-card bg-fg p-4">
              <div class="mb-4 flex flex-row justify-between gap-4">
                <Dialog.Title class="ml-1.5 font-semibold">
                  {
                    {
                      new: "Создание ключа",
                      refresh: "Перевыпуск ключа",
                    }[dialogType()]
                  }
                </Dialog.Title>
                <Show when={dialogType() === "new"}>
                  <Dialog.CloseTrigger class="rounded-[8px]">
                    <Icon icon={close} class="h-6 w-6 bg-text" />
                  </Dialog.CloseTrigger>
                </Show>
              </div>

              <Switch
                fallback={
                  <>
                    <Input
                      type="text"
                      name="Название"
                      invalid={name() !== undefined && name()!.length === 0}
                      value={name() ?? ""}
                      onInput={setName}
                      class="mt-2"
                      disabled={isDialogLoading()}
                    />
                    <Button
                      class="mt-4"
                      loading={isDialogLoading()}
                      disabled={!name()}
                      onClick={async () => {
                        setDialogLoading(true)
                        const { token } = await createApiKey(props.project.id, name()!)
                        setGeneratedKey(token)
                        setKey({
                          name: name()!,
                          display: `${token.slice(0, 4)}***${token.slice(-4)}`,
                        })
                        setDialogLoading(false)
                      }}>
                      Создать
                    </Button>
                  </>
                }>
                <Match when={generatedKey()}>
                  <div class="relative flex w-full flex-row justify-between overflow-auto rounded-content bg-hint2/15 px-[21px] pb-2 pt-6">
                    <div class="absolute top-1 text-sm text-hint2">Ключ:</div>
                    <div class="scrollbar-hide overflow-auto text-nowrap">{generatedKey()}</div>
                  </div>
                  <Button class="mt-4" onClick={() => setDialogOpen(false)}>
                    Скопировать и выйти
                  </Button>
                </Match>
                <Match when={dialogType() === "refresh" && !generatedKey()}>
                  <div class="grid place-items-center p-2">
                    <Icon icon={spinner} class="h-8 w-8 bg-text" />
                  </div>
                </Match>
              </Switch>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
