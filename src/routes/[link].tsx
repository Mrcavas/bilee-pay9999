import { debounce } from "@solid-primitives/scheduled"
import { Title } from "@solidjs/meta"
import { RouteSectionProps, createAsync } from "@solidjs/router"
import { Accessor, For, Match, Show, Switch, createEffect, createResource, createSignal } from "solid-js"
import { getProjectInfo, getTelegramUser, getTransaction } from "~/api"
import { MainLayout } from "~/app"
import arrow from "~/assets/arrow.svg"
import light from "~/assets/light.svg"
import spinner from "~/assets/spinner.svg"
import Button from "~/components/button"
import DetailedInfo from "~/components/detailed-info"
import Icon from "~/components/icon"
import IconDisplay from "~/components/icon-display"
import Input from "~/components/input"
import createErrorToaster, { createFormatHandler, formatNumber, isObjectEmpty, setCaretPosition } from "~/utilities"
import Error from "./(error)"

function PaymentMethodCard(props: {
  method: PaymentMethod
  amount: number
  selectedMethod: Accessor<PaymentMethod | undefined>
  setSelectedMethod: (method: PaymentMethod) => void
}) {
  const less = () => props.amount < props.method.min_amount
  const more = () => props.amount > props.method.max_amount
  const good = () => !less() && !more()

  return (
    <button
      disabled={!good()}
      onClick={() => props.setSelectedMethod(props.method)}
      class={
        "flex flex-row items-center gap-4 rounded-content px-5 py-[13px] text-left transition-colors " +
        (good()
          ? props.selectedMethod() === props.method
            ? "bg-primary/20 shadow-inside-border shadow-primary"
            : "bg-hint2/10"
          : "dashed")
      }>
      <IconDisplay icon={props.method.icon} class="h-[38px] w-[38px]" />
      <div class={good() ? "" : "text-hint1"}>
        <div class="font-semibold">{props.method.name}</div>
        <Switch fallback={<div class="text-sm text-hint3">Комиссия {props.method.commission}%</div>}>
          <Match when={less()}>
            <div class="text-sm">
              Доступно от <span class="font-semibold">{props.method.min_amount} ₽</span>
            </div>
          </Match>
          <Match when={more()}>
            <div class="text-sm">
              Доступно до <span class="font-semibold">{props.method.max_amount} ₽</span>
            </div>
          </Match>
        </Switch>
      </div>
    </button>
  )
}

export default function Index(props: RouteSectionProps) {
  const searchParams = new URLSearchParams(props.location.search)
  const searchTgId = searchParams.get("id") ?? ""
  const searchAmount = searchParams.get("amount")
  let amountRef: HTMLDivElement | undefined
  const [amount, setAmount] = createSignal(searchAmount ?? "")
  const projectInfo = createAsync(() => getProjectInfo(props.params.link, searchTgId))
  const project = () =>
    projectInfo() as Project & {
      methods: PaymentMethod[]
      tgUser: TelegramUser | {}
    }

  const [tgId, setTgId] = createSignal(searchTgId)
  const [tgUserFetched, { refetch }] = createResource(() => getTelegramUser(project()?.id, tgId()))
  const tgUserFrom = (obj: TelegramUser | {}) => (isObjectEmpty(obj) ? undefined : (obj as TelegramUser))
  const [tgUser, setTgUser] = createSignal<TelegramUser | undefined>(
    !project() ? undefined : tgUserFrom(project()!.tgUser)
  )
  const sortedMethods = () => project().methods.sort((a, b) => a.position_index - b.position_index)
  const primaryMethods = () => sortedMethods().filter(method => method.primary)
  const secondaryMethods = () => sortedMethods().filter(method => !method.primary)
  const [selectedMethod, setSelectedMethod] = createSignal<PaymentMethod | undefined>()
  const computedCommission = () => ((selectedMethod()?.commission ?? 0) / 100) * +amount()
  const triggerTgRefetch = debounce(refetch, 500)
  const [invalid, setInvalid] = createSignal(false)
  const [loading, setLoading] = createSignal(false)
  const [displayError, toaster] = createErrorToaster()

  createEffect(() => {
    const fetched = tgUserFetched()
    if (!fetched) return
    setTgUser(tgUserFrom(fetched))
  })

  createEffect(() => {
    const project = projectInfo()
    if (!project?.success) return
    setTgUser(isObjectEmpty(project.tgUser) ? undefined : (project.tgUser as TelegramUser))
  })

  createEffect(() => setInvalid(!!tgUser() && !!tgUser()?.invalid))

  createEffect(() => {
    const method = selectedMethod()
    if (!method) return
    if (+amount() < method.min_amount || +amount() > method.max_amount) setSelectedMethod()
  })

  return (
    <MainLayout dontCenter class="max-w-[520px]">
      {toaster()}
      <Show when={projectInfo()?.success} fallback={<Error />}>
        <Title>{project().name}</Title>
        <div class="flex flex-row items-center gap-3 p-4">
          <img src={project().picture} alt="" class="h-14 w-14 rounded-full" />
          <div class="text-lg font-semibold">{project().name}</div>
        </div>
        <div class="mx-4 mt-[5px] text-md font-semibold sm:text-lg">Пополнение баланса</div>
        <div class="mt-2.5 grid grid-cols-1 gap-4">
          <div class="rounded-card bg-fg p-4">
            <Input
              name="ID пользователя"
              type="tel"
              class="mb-2.5"
              invalid={invalid()}
              value={tgId()}
              onInput={v => {
                setTgId(v)
                setInvalid(false)
                triggerTgRefetch()
              }}
              append={
                <Show when={tgUserFetched.loading}>
                  <Icon icon={spinner} class="h-6 w-6 bg-primary" />
                </Show>
              }
            />
            <Show
              when={tgUser()?.id}
              fallback={
                <a
                  href="https://t.me/BileedBot"
                  class="flex w-full flex-row items-center gap-2.5 rounded-content bg-primary/30 py-3.5 pl-[15px] pr-[21px] font-semibold">
                  <Icon icon={light} class="h-7 w-7 bg-text" />
                  Узнать свой ID
                </a>
              }>
              <div class="flex grow flex-row items-center justify-between rounded-content bg-success/30 py-2 pl-3 pr-5">
                <div class="flex flex-row items-center gap-2">
                  <img src={tgUser()!.avatar!} class="h-10 w-10 rounded-full" />
                  <div class="flex flex-col">
                    <span class="text-card font-semibold">{tgUser()!.full_name}</span>
                    <span class="text-xs">@{tgUser()!.username}</span>
                  </div>
                </div>
              </div>
            </Show>
          </div>
          <div class="overflow-hidden rounded-card bg-fg p-4">
            <div class="ml-1.5 font-semibold">Сумма пополнения</div>
            <div
              onClick={() => {
                amountRef!.focus()
                if (amountRef!.innerText) setCaretPosition(amountRef!, amountRef!.innerText.length)
              }}
              class="scrollbar-hide ml-1.5 mt-3 flex cursor-text flex-row flex-nowrap gap-3 overflow-x-auto text-xl font-semibold sm:text-[46px]">
              <div
                onClick={e => e.stopPropagation()}
                ref={amountRef}
                contentEditable
                data-placeholder="100"
                class="amount-input inline w-fit text-nowrap outline-none"
                onBeforeInput={e => e.data && /[^\d]/g.test(e.data) && e.preventDefault()}
                onInput={createFormatHandler(setAmount, () => amountRef!)}
                inputMode="decimal">
                {searchAmount ? formatNumber(+searchAmount) : ""}
              </div>
              <span class="font-normal text-hint2">₽</span>
            </div>
            <div class="scrollbar-hide -mx-4 mt-3 w-[calc(100%+2rem)] overflow-x-auto px-4">
              <div class="flex w-max flex-row gap-1.5 overflow-hidden">
                <button
                  class="shrink-0 rounded-content bg-primary/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "100") && setAmount("100")}>
                  100 ₽
                </button>
                <button
                  class="shrink-0 rounded-content bg-primary/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "300") && setAmount("300")}>
                  300 ₽
                </button>
                <button
                  class="shrink-0 rounded-content bg-success/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "500") && setAmount("500")}>
                  500 ₽
                </button>
                <button
                  class="shrink-0 rounded-content bg-success/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "1 000") && setAmount("1000")}>
                  1 000 ₽
                </button>
                <button
                  class="shrink-0 rounded-content bg-error/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "5 000") && setAmount("5000")}>
                  5 000 ₽
                </button>
              </div>
            </div>
          </div>
          <div class="rounded-card bg-fg p-4">
            <div class="ml-1.5 font-semibold">Способ оплаты</div>
            <div class="mt-3.5 flex flex-col gap-2.5">
              <For each={primaryMethods()}>
                {method => (
                  <PaymentMethodCard
                    method={method}
                    amount={+amount()}
                    selectedMethod={selectedMethod}
                    setSelectedMethod={setSelectedMethod}
                  />
                )}
              </For>
            </div>
            <Show when={secondaryMethods().length > 0}>
              <DetailedInfo
                triggerClass="w-full"
                trigger={isOpen => (
                  <div class="mb-1 mt-2.5 flex w-full select-none flex-row items-center justify-between gap-1 px-2">
                    <div class="text-nowrap text-hint3">Показать все</div>
                    <div class="h-7 w-7 rounded-full bg-hint2/15 p-0.5">
                      <Icon
                        icon={arrow}
                        class={"h-6 w-6 bg-hint3 transition-transform " + (isOpen() ? "rotate-90" : "-rotate-90")}
                      />
                    </div>
                  </div>
                )}>
                <div class="mt-1.5 flex flex-col gap-2.5">
                  <For each={secondaryMethods()}>
                    {method => (
                      <PaymentMethodCard
                        method={method}
                        amount={+amount()}
                        selectedMethod={selectedMethod}
                        setSelectedMethod={setSelectedMethod}
                      />
                    )}
                  </For>
                </div>
              </DetailedInfo>
            </Show>
            <Button
              disabled={!selectedMethod() || !tgUser() || tgUser()?.invalid}
              loading={loading()}
              class="mt-3.5 px-[21px] py-4"
              onClick={async () => {
                setLoading(true)
                const resp = await getTransaction(project().id, {
                  amount: +amount(),
                  method_id: selectedMethod()!.id,
                  telegram_id: tgUser()!.id!,
                })
                if (!resp.success) {
                  setLoading(false)
                  displayError(resp.error?.user_message ?? "Что-то пошло не так")
                  return
                }
                window.location.href = resp.result.url
              }}>
              К оплате
            </Button>
            <Show when={selectedMethod()}>
              <div class="mt-2.5 w-full text-center text-sm text-hint2">
                Комиссия{" "}
                {computedCommission() < selectedMethod()!.min_commission_amount
                  ? selectedMethod()!.min_commission_amount.toString()
                  : `~${computedCommission().toFixed(2)}`}{" "}
                ₽
              </div>
            </Show>
          </div>
        </div>
        <div class="mt-12 p-2 text-sm text-hint2">
          <div class="text-base font-semibold text-text">© {project().name}, 2024</div>

          <div class="mt-5 whitespace-pre-line">{project().footer_text}</div>

          <a href={project().support_url} class="mt-5 block underline">
            Поддержка
          </a>
          <a href="https://bilee.ru/bots-agreement" class="mt-1.5 block underline">
            Пользовательское соглашение
          </a>
          <a href="https://bilee.ru/privacy" class="mt-1.5 block underline">
            Политика конфиденциальности
          </a>
        </div>
      </Show>
    </MainLayout>
  )
}
