import { RouteSectionProps, createAsync } from "@solidjs/router"
import { For, Match, Show, Switch, createSignal } from "solid-js"
import { getProjectInfo } from "~/api"
import { MainLayout } from "~/app"
import btc from "~/assets/btc.svg?url"
import card from "~/assets/card.svg?url"
import light from "~/assets/light.svg?url"
import sbp from "~/assets/sbp.svg?url"
import Button from "~/components/button"
import Icon from "~/components/icon"
import Input from "~/components/input"
import { createFormatHandler } from "~/utilities"

/*
<div class="">
  <Icon icon={card} class="h-[28px] w-[38px] bg-hint3" />
  <div>
    <div class="font-semibold">Карта</div>
    <div class="text-sm text-hint3">Комиссия 3,5%</div>
  </div>
</div>
*/
function PaymentMethodCard(props: { method: PaymentMethod; amount: number }) {
  const less = () => props.amount < props.method.min_amount
  const more = () => props.amount > props.method.max_amount
  const good = () => !less() && !more()

  return (
    <div
      class={"flex flex-row items-center gap-4 rounded-content px-5 py-[13px] " + (good() ? "bg-hint2/10" : "dashed")}>
      <img src={props.method.icon.url} alt="" class="h-[38px] w-[38px]" />
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
    </div>
  )
}

export default function Index(props: RouteSectionProps) {
  let amountRef: HTMLDivElement | undefined
  const [amount, setAmount] = createSignal("")
  const projectInfo = createAsync(() => getProjectInfo(props.params.link))
  const project = () =>
    projectInfo() as Project & {
      methods: PaymentMethod[]
    }

  return (
    <MainLayout dontCenter class="max-w-[520px]">
      <Show when={projectInfo()?.success} fallback={<>Error</>}>
        <div class="flex flex-row items-center gap-3 p-4">
          {/* <div class="h-14 w-14 rounded-full bg-fg" /> */}
          <img src={project().picture} alt="" class="h-14 w-14 rounded-full" />
          <div class="text-lg font-semibold">{project().name}</div>
        </div>
        <div class="mx-4 mt-[5px] text-md font-semibold sm:text-lg">Пополнение баланса</div>
        <div class="mt-2.5 grid grid-cols-1 gap-4">
          <div class="rounded-card bg-fg p-4">
            <Input name="ID пользователя" type="tel" class="mb-2.5" />
            <button class="flex w-full flex-row items-center gap-2.5 rounded-content bg-primary/30 py-3.5 pl-[15px] pr-[21px] font-semibold">
              <Icon icon={light} class="h-7 w-7 bg-primary" />
              Узнать свой ID
            </button>
          </div>
          <div class="overflow-hidden rounded-card bg-fg p-4">
            <div class="ml-1.5 font-semibold">Сумма пополнения</div>
            <div
              onClick={() => amountRef?.focus()}
              class="scrollbar-hide ml-1.5 mt-3 flex cursor-text flex-row flex-nowrap gap-3 overflow-x-auto text-xl font-semibold sm:text-[46px]">
              <div
                ref={amountRef}
                contentEditable
                data-placeholder="100"
                class="amount-input inline w-fit text-nowrap outline-none"
                onBeforeInput={e => e.data && /[^\d]/g.test(e.data) && e.preventDefault()}
                onInput={createFormatHandler(setAmount, () => amountRef!)}
                inputMode="decimal"
              />
              <span class="font-normal text-hint2">₽</span>
            </div>
            <div class="scrollbar-hide -mx-4 mt-3 w-[calc(100%+2rem)] overflow-x-auto px-4">
              <div class="flex w-max flex-row gap-1.5 overflow-hidden">
                <button
                  class="shrink-0 rounded-content bg-primary/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "100")}>
                  100 ₽
                </button>
                <button
                  class="shrink-0 rounded-content bg-primary/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "300")}>
                  300 ₽
                </button>
                <button
                  class="shrink-0 rounded-content bg-success/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "500")}>
                  500 ₽
                </button>
                <button
                  class="shrink-0 rounded-content bg-success/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "1 000")}>
                  1 000 ₽
                </button>
                <button
                  class="shrink-0 rounded-content bg-error/30 px-[18px] py-1.5"
                  onClick={() => (amountRef!.innerText = "5 000")}>
                  5 000 ₽
                </button>
              </div>
            </div>
          </div>
          <div class="flex flex-col justify-between gap-3.5 rounded-card bg-fg p-4">
            <div class="ml-1.5 font-semibold">Способ оплаты</div>
            <div class="flex flex-col gap-2.5">
              {/* <div class="dashed flex flex-row items-center gap-4 rounded-content px-5 py-[13px]">
                <Icon icon={sbp} class="h-[38px] w-[38px]" colored />
                <div class="text-hint1">
                  <div class="font-semibold">СБП</div>
                  <div class="text-sm">
                    Доступно от <span class="font-semibold">200 ₽</span>
                  </div>
                </div>
              </div>
              <div class="flex flex-row items-center gap-4 rounded-content bg-hint2/10 px-5 py-[13px]">
                <Icon icon={card} class="h-[28px] w-[38px] bg-hint3" />
                <div>
                  <div class="font-semibold">Карта</div>
                  <div class="text-sm text-hint3">Комиссия 3,5%</div>
                </div>
              </div>
              <div class="dashed flex flex-row items-center gap-4 rounded-content px-5 py-[13px]">
                <Icon icon={btc} class="h-[38px] w-[38px] bg-hint1" />
                <div class="text-hint1">
                  <div class="font-semibold">Криптовалюта</div>
                  <div class="text-sm">
                    Доступно от <span class="font-semibold">200 ₽</span>
                  </div>
                </div>
              </div> */}
              <For each={project().methods}>{method => <PaymentMethodCard method={method} amount={+amount()} />}</For>
            </div>
            <div>
              <Button class="px-[21px] py-4">К оплате</Button>
              <div class="mt-2.5 w-full text-center text-sm text-hint2">Комиссия ~3,63 ₽</div>
            </div>
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
