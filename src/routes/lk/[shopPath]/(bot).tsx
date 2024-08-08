import { Dialog } from "@ark-ui/solid"
import { useNavigate } from "@solidjs/router"
import { createSignal } from "solid-js"
import { Portal } from "solid-js/web"
import { deleteProject } from "~/api"
import close from "~/assets/close.svg"
import infoCircle from "~/assets/info-circle.svg"
import trash from "~/assets/trash.svg"
import Button from "~/components/button"
import Icon from "~/components/icon"
import Input from "~/components/input"
import { createValidatedField } from "~/utilities"
export default function BotTab(props: { project: Project }) {
  const [isOpen, setOpen] = createSignal(false)
  const [isLoading, setLoading] = createSignal(false)
  const confirm = createValidatedField(v => v === props.project.link, "")
  const navigate = useNavigate()

  return (
    <>
      <div class="px-2 text-sm sm:text-card">
        <p>Для корректной работы сервиса нам требуется токен Вашего Telegram бота</p>
        <p>Мы используем его только для получения данных о пользователе, когда он вводит свой ID на сайте</p>
        <p>Изменить токен нельзя. Чтобы использовать другой токен - создайте новый проект</p>
      </div>
      <div class="mt-4 flex flex-row flex-wrap gap-2.5">
        <div class="flex grow flex-row items-center justify-between rounded-content bg-success/30 py-2 pl-3 pr-5">
          <div class="flex flex-row items-center gap-2">
            <img src={props.project.picture} class="h-10 w-10 rounded-full" />
            <div class="flex flex-col">
              <span class="text-card font-semibold">{props.project.name}</span>
              <span class="text-xs">@{props.project.url.substring(13)}</span>
            </div>
          </div>
        </div>
      </div>
      <Dialog.Root
        closeOnInteractOutside={false}
        onOpenChange={({ open }) => setOpen(open)}
        open={isOpen()}
        onExitComplete={() => confirm.reset()}>
        {/* <Dialog.Trigger class="flex flex-row items-center justify-center gap-2.5 rounded-content bg-error p-4 pl-5 pr-6 font-semibold text-text-on-primary">
          <Icon icon={trash} class="h-6 w-6 shrink-0 bg-text-on-primary" />
          Удалить проект
        </Dialog.Trigger> */}
        <div class="grid place-items-center pt-3">
          <Dialog.Trigger class="font-semibold text-error text-card">
            {/* <Icon icon={trash} class="h-6 w-6 shrink-0 bg-text-on-primary" /> */}
            Удалить проект
          </Dialog.Trigger>
        </div>
        <Portal>
          <Dialog.Backdrop class="fixed left-0 top-0 h-full w-full bg-hint1/15" />
          <Dialog.Positioner class="fixed left-0 top-0 flex h-full w-full flex-col items-center justify-center px-4 py-10">
            <Dialog.Content class="scrollbar-hide w-full max-w-[520px] overflow-y-auto rounded-card bg-fg p-4">
              <div class="mb-4 flex flex-row justify-between gap-4">
                <Dialog.Title class="ml-1.5 font-semibold">Удалить проект</Dialog.Title>
                <Dialog.CloseTrigger class="rounded-[8px]">
                  <Icon icon={close} class="h-6 w-6 bg-text" />
                </Dialog.CloseTrigger>
              </div>

              <div class="mt-1 flex flex-row gap-2.5 rounded-content bg-error/30 p-4">
                <Icon icon={infoCircle} class="h-9 w-9 shrink-0 bg-error" />
                <div>
                  После удаления проект нельзя восстановить, только создать новый. <br /> Для подтверждения введите путь
                  к проекту: <span class="font-semibold">{props.project.link}</span> в поле ниже
                </div>
              </div>

              <Input {...confirm.inputProps()} type="text" name="Подтверждение" class="mt-3" />

              <Button
                class="mt-4 gap-2.5 bg-error"
                loading={isLoading()}
                disabled={!confirm.isValid()}
                onClick={async () => {
                  setLoading(true)
                  await deleteProject(props.project.id)
                  navigate("/lk")
                }}>
                <Icon icon={trash} class="h-6 w-6 bg-text-on-primary" /> Удалить
              </Button>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
