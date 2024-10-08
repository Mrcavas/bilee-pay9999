import { Dialog, PolymorphicProps, Select } from "@ark-ui/solid"
import { createAsync } from "@solidjs/router"
import {
  CollisionDetector,
  DragDropProvider,
  DragDropSensors,
  DragEventHandler,
  DragOverlay,
  Draggable,
  Droppable,
  SortableProvider,
  createDroppable,
  createSortable,
  mostIntersecting,
  transformStyle,
} from "@thisbeyond/solid-dnd"
import {
  Accessor,
  For,
  Index,
  JSX,
  Match,
  Setter,
  Show,
  Switch,
  batch,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js"
import { createStore } from "solid-js/store"
import { Portal } from "solid-js/web"
import {
  createPaymentMethod,
  deletePaymentMethod,
  getIcons,
  getPaymentMethods,
  getPaymentSystems,
  updateMethodPositions,
  updatePaymentMethod,
} from "~/api"
import add from "~/assets/add.svg"
import arrow from "~/assets/arrow.svg"
import check from "~/assets/check.svg"
import close from "~/assets/close.svg"
import drag from "~/assets/drag.svg"
import pause from "~/assets/pause.svg"
import play from "~/assets/play.svg"
import rearrange from "~/assets/rearrange.svg"
import selectIcon from "~/assets/select-icon.svg"
import spinner from "~/assets/spinner.svg"
import trash from "~/assets/trash.svg"
import Button from "~/components/button"
import { CheckBox } from "~/components/checkbox"
import { GoCardBtn, GoCardInsides } from "~/components/gocard"
import Icon from "~/components/icon"
import IconDisplay from "~/components/icon-display"
import Input from "~/components/input"
import Selector from "~/components/selector"
import createErrorToaster, {
  Field,
  areFieldsFilled,
  createValidatedField,
  mainScrollable,
  resetFields,
} from "~/utilities"

function MethodCard(
  props: { method: PaymentMethod; paymentSystems: Accessor<PaymentSystem[]> } & JSX.IntrinsicElements["button"]
) {
  const paymentSystem = props.paymentSystems().find(p => p.id === props.method.payment_system_id)

  return (
    <GoCardBtn
      icon={<IconDisplay icon={props.method.icon} class="h-8 w-8" />}
      description={paymentSystem?.name}
      title={props.method.name}
      class={"flex-grow rounded-content " + (props.method.enabled ? "bg-hint2/15" : "dashed")}
      {...props}
    />
  )
}

function SortableMethodCard(props: {
  item: number
  methods: Accessor<PaymentMethod[]>
  paymentSystems: Accessor<PaymentSystem[]>
  noDrag?: boolean
}) {
  const sortable = createSortable(props.item)
  const method = props.methods().find(method => method.id === props.item)!
  const paymentSystem = props.paymentSystems().find(p => p.id === method.payment_system_id)!

  return (
    <div
      ref={sortable.ref}
      style={transformStyle(sortable.transform)}
      class={
        "flex flex-grow touch-none select-none flex-row items-center gap-3 rounded-content px-4 py-3.5 " +
        (method.enabled ? "bg-hint2/15" : "dashed")
      }
      classList={{ "opacity-25": sortable.isActiveDraggable }}
      {...(props.noDrag ? {} : sortable.dragActivators)}>
      <GoCardInsides
        icon={<IconDisplay icon={method.icon} class="h-6 w-6" />}
        description={paymentSystem.name}
        title={method.name}>
        <Icon icon={drag} class={"h-6 w-6 " + (props.noDrag ? "bg-hint2" : "bg-text")} />
      </GoCardInsides>
    </div>
  )
}

function PrimaryDroppable(props: {
  items: number[]
  methods: Accessor<PaymentMethod[]>
  paymentSystems: Accessor<PaymentSystem[]>
}) {
  const droppable = createDroppable("primary")

  return (
    <div ref={droppable.ref} class="flex flex-col gap-3">
      <SortableProvider ids={props.items}>
        <For each={props.items}>
          {item => (
            <SortableMethodCard
              item={item}
              methods={props.methods}
              noDrag={props.items.length === 1}
              paymentSystems={props.paymentSystems}
            />
          )}
        </For>
      </SortableProvider>
    </div>
  )
}

function SecondaryDroppable(props: {
  items: number[]
  methods: Accessor<PaymentMethod[]>
  paymentSystems: Accessor<PaymentSystem[]>
}) {
  const droppable = createDroppable("secondary")

  return (
    <div ref={droppable.ref} class="flex flex-col gap-3">
      <SortableProvider ids={props.items}>
        <For
          each={props.items}
          fallback={(() => {
            let div: HTMLDivElement | undefined

            onMount(() => batch(() => mainScrollable().scrollBy(0, div?.getBoundingClientRect().height! + 12)))
            onCleanup(() => batch(() => mainScrollable().scrollBy(0, -(div?.getBoundingClientRect().height! + 12))))

            return (
              <div
                ref={div}
                class="dashed flex flex-grow flex-row items-center justify-center rounded-content px-4 py-3.5 text-center text-sm font-semibold text-hint2">
                Чтобы сделать способ скрытым, переместите его сюда
              </div>
            )
          })()}>
          {item => <SortableMethodCard item={item} methods={props.methods} paymentSystems={props.paymentSystems} />}
        </For>
      </SortableProvider>
    </div>
  )
}

function MethodsEdit({
  ref,
  sortedMethods,
  setSaver,
  paymentSystems,
}: {
  ref: Setter<HTMLDivElement | undefined>
  sortedMethods: Accessor<PaymentMethod[]>
  setSaver: Setter<(cb: (primaryIds: number[], secondaryIds: number[]) => void) => void>
  paymentSystems: Accessor<PaymentSystem[]>
}) {
  const primaryMethods = sortedMethods().filter(method => method.primary)
  const secondaryMethods = sortedMethods().filter(method => !method.primary)

  const [containers, setContainers] = createStore<Record<string, number[]>>({
    primary: primaryMethods.map(method => method.id),
    secondary: secondaryMethods.map(method => method.id),
  })

  onMount(() => {
    setSaver(_ => cb => cb(containers.primary, containers.secondary))
  })

  const containerIds = () => Object.keys(containers)

  const isContainer = (id: any) => containerIds().includes(id)

  const getContainer = (id: number) => {
    for (const [key, items] of Object.entries(containers)) {
      if (items.includes(id)) {
        return key
      }
    }
  }

  const closestContainerOrItem: CollisionDetector = (draggable, droppables, context) => {
    const closestContainer = mostIntersecting(
      draggable,
      droppables.filter(droppable => isContainer(droppable.id)),
      context
    )
    if (closestContainer) {
      const containerItemIds = containers[closestContainer.id]
      const closestItem = mostIntersecting(
        draggable,
        droppables.filter(droppable => containerItemIds.includes(droppable.id as number)),
        context
      )
      if (!closestItem) {
        return closestContainer
      }

      if (getContainer(draggable.id as number) !== closestContainer.id) {
        const isLastItem = containerItemIds.indexOf(closestItem.id as number) === containerItemIds.length - 1
        if (isLastItem) {
          const belowLastItem = draggable.transformed.center.y > closestItem.transformed.center.y

          if (belowLastItem) {
            return closestContainer
          }
        }
      }
      return closestItem
    }
    return null
  }

  const move = (onlyWhenChangingContainer: boolean, draggable?: Draggable | null, droppable?: Droppable | null) => {
    if (!draggable || !droppable) return
    const draggableContainer = getContainer(draggable.id as number)!
    const droppableContainer = isContainer(droppable.id) ? droppable.id : getContainer(droppable.id as number)!

    if (draggableContainer != droppableContainer || !onlyWhenChangingContainer) {
      const containerItemIds = containers[droppableContainer]
      let index = containerItemIds.indexOf(droppable.id as number)
      if (index === -1) index = containerItemIds.length

      batch(() => {
        setContainers(draggableContainer, items => items.filter(item => item !== draggable.id))
        setContainers(droppableContainer as string, items => [
          ...items.slice(0, index),
          draggable.id as number,
          ...items.slice(index),
        ])
      })
    }
  }

  const onDragOver: DragEventHandler = ({ draggable, droppable }) => move(true, draggable, droppable)

  const onDragEnd: DragEventHandler = ({ draggable, droppable }) => move(false, draggable, droppable)

  return (
    <DragDropProvider onDragOver={onDragOver} onDragEnd={onDragEnd} collisionDetector={closestContainerOrItem}>
      <DragDropSensors />
      <div ref={ref}>
        <div class="mb-1.5 select-none px-2 text-card font-semibold">Основные способы:</div>
        <PrimaryDroppable methods={sortedMethods} items={containers.primary} paymentSystems={paymentSystems} />
        <div class="mb-1.5 mt-3 select-none px-2 text-card font-semibold">Неосновные способы:</div>
        <SecondaryDroppable methods={sortedMethods} items={containers.secondary} paymentSystems={paymentSystems} />
      </div>
      <DragOverlay>
        {draggable => {
          const method = sortedMethods().find(method => method.id === draggable?.id)
          if (!method) return null
          const paymentSystem = paymentSystems().find(p => p.id === method.payment_system_id)
          if (!paymentSystem) return null
          return (
            <div
              class={
                "flex flex-grow touch-none flex-row items-center gap-3 rounded-content bg-fg bg-hint2/15 px-4 py-3.5 " +
                (method.enabled ? "bg-hint2/15" : "dashed")
              }>
              <GoCardInsides
                icon={<IconDisplay icon={method.icon} class="h-6 w-6" />}
                description={paymentSystem.name}
                title={method.name}>
                <Icon icon={drag} class="h-6 w-6 bg-text" />
              </GoCardInsides>
            </div>
          )
        }}
      </DragOverlay>
    </DragDropProvider>
  )
}

export default function MethodsTab(props: { project: Project }) {
  let lastProjectId = props.project.id
  const [isEditing, setIsEditing] = createSignal(false)
  const [methods, setMethods] = createSignal<PaymentMethod[]>([])
  const sortedMethods = () => methods().sort((a, b) => a.position_index - b.position_index)
  const [saver, setSaver] = createSignal<(cb: (primaryIds: number[], secondaryIds: number[]) => void) => void>(cb =>
    cb([], [])
  )
  const [editorRef, setEditorRef] = createSignal<HTMLDivElement>()
  const [isLoading, setLoading] = createSignal(false)
  const icons = createAsync(() => getIcons(), { initialValue: [] })
  const paymentSystems = createAsync(() => getPaymentSystems(), { initialValue: [] })
  const fetchedMethods = createAsync(() => getPaymentMethods(props.project.id))

  createEffect(() => {
    const _methods = fetchedMethods()
    if (_methods === undefined) return
    setLoading(false)
    setMethods(_methods)
    console.log(_methods)
  })

  createEffect(() => {
    if (props.project.id === lastProjectId) return
    setLoading(true)
    lastProjectId = props.project.id
  })

  return (
    <>
      <div class="mb-5 px-2 text-sm sm:text-card">
        <p>Добавьте способы оплаты и измените их порядок отображения на странице оплаты</p>
        <p>Максимальное число способов оплаты - 8</p>
      </div>

      <Show
        when={!isLoading() || !icons() || !paymentSystems()}
        fallback={
          <div class="grid place-items-center p-3">
            <Icon icon={spinner} class="h-8 w-8 bg-text" />
          </div>
        }>
        <Show
          when={isEditing()}
          fallback={
            <button
              class={"mb-3 flex flex-row items-center gap-1.5 px-2 " + (methods().length <= 1 ? "text-hint2" : "")}
              disabled={methods().length <= 1}
              onClick={() => {
                setIsEditing(true)
                batch(() => editorRef()?.scrollIntoView({ behavior: "smooth" }))
              }}>
              <Icon icon={rearrange} class={"h-6 w-6 " + (methods().length <= 1 ? "bg-hint2" : "bg-text")} />
              <div class="font-semibold">Изменить порядок</div>
            </button>
          }>
          <button
            class="mb-3 flex flex-row gap-2 rounded-content bg-primary p-2 pr-3 text-text-on-primary"
            onClick={() => {
              saver()!(async (primaryIds, secondaryIds) => {
                const methods = sortedMethods()
                for (let i = 0; i < primaryIds.length; i++) {
                  const method = methods.find(method => method.id === primaryIds[i])!
                  method.position_index = i + 1
                  method.primary = true
                }
                for (let i = 0; i < secondaryIds.length; i++) {
                  const method = methods.find(method => method.id === secondaryIds[i])!
                  method.position_index = i + 1 + primaryIds.length
                  method.primary = false
                }
                batch(() => mainScrollable().scrollTo({ behavior: "smooth", top: 0 }))
                setLoading(true)
                await updateMethodPositions(
                  props.project.id,
                  methods.map(m => ({
                    id: m.id,
                    position_index: m.position_index,
                    primary: m.primary,
                  }))
                )
                setMethods([...methods])
                setIsEditing(false)
                setLoading(false)
              })
            }}>
            <Icon icon={check} class="h-6 w-6 bg-text-on-primary" />
            <div class="font-semibold">Сохранить</div>
          </button>
        </Show>

        <Show
          when={isEditing()}
          fallback={
            <div class="flex flex-wrap gap-3">
              <For each={sortedMethods()}>
                {item => (
                  <EditMethodDialog
                    project={props.project}
                    icons={icons()}
                    paymentSystems={paymentSystems()}
                    method={item}
                    methods={methods}
                    setMethods={setMethods}
                    asChild={props => <MethodCard method={item} {...props} paymentSystems={paymentSystems} />}
                  />
                )}
              </For>
              <Show when={methods().length < 8}>
                <EditMethodDialog
                  project={props.project}
                  icons={icons()}
                  paymentSystems={paymentSystems()}
                  new
                  methods={methods}
                  setMethods={setMethods}
                  asChild={props => (
                    <GoCardBtn
                      icon={<Icon icon={add} class="h-6 w-6 bg-text-on-primary" />}
                      title="Добавить"
                      class="flex-grow rounded-content bg-primary text-text-on-primary"
                      noArrow
                      {...props}
                    />
                  )}
                />
              </Show>
            </div>
          }>
          <MethodsEdit
            ref={setEditorRef}
            sortedMethods={sortedMethods}
            setSaver={setSaver}
            paymentSystems={paymentSystems}
          />
        </Show>
      </Show>
    </>
  )
}

function EditMethodDialog(
  props: PolymorphicProps<"button"> & {
    methods: Accessor<PaymentMethod[]>
    setMethods: Setter<PaymentMethod[]>
    icons: Icon[]
    project: Project
    paymentSystems: PaymentSystem[]
  } & (
      | {
          method: PaymentMethod
          new?: false
        }
      | {
          method?: undefined
          new: true
        }
    )
) {
  const [isOpen, setIsOpen] = createSignal(false)
  const name = createValidatedField(v => !!v && v.length <= 16, props.method?.name ?? "")
  const inRange = (v: number) => v >= 0 && v <= 1000000
  const min_amount: Field<string> = createValidatedField(
    v => !!v && inRange(+v),
    props.method?.min_amount.toString() ?? ""
  )
  const max_amount: Field<string> = createValidatedField(
    v => !!v && inRange(+v),
    props.method?.max_amount.toString() ?? ""
  )
  const commission = createValidatedField(v => !!v && +v >= 0 && +v < 100, props.method?.commission.toString() ?? "")
  const min_commission_amount = createValidatedField(
    v => !!v && inRange(+v),
    props.method?.min_commission_amount.toString() ?? ""
  )
  const [icon, setIcon] = createSignal(props.method?.icon)
  const findPaymentSystem = (id: number) => props.paymentSystems.find(s => s.id === id)
  const initialPaymentSystem = props.method?.payment_system_id
    ? findPaymentSystem(props.method.payment_system_id)
    : undefined
  const [paymentSystem, setPaymentSystem] = createSignal(initialPaymentSystem)
  const [isLoading, setLoading] = createSignal(false)
  const [isDeleteLoading, setDeleteLoading] = createSignal(false)
  const [enabled, setEnabled] = createSignal(props.method?.enabled ?? true)
  const [paramsData, setParamsData] = createSignal(props.method?.params ?? [])
  const paramsFilled = () =>
    paymentSystem()
      ?.method_params.filter(p => !p.is_optional)
      .every(p => paramsData().find(d => d.param_id === p.id))

  const [displayError, toaster] = createErrorToaster()

  return (
    <Dialog.Root
      closeOnInteractOutside={false}
      onOpenChange={({ open }) => setIsOpen(open)}
      open={isOpen()}
      onExitComplete={() => {
        resetFields(name, min_amount, max_amount, commission, min_commission_amount)
        setLoading(false)
        setDeleteLoading(false)
        setIcon(props.method?.icon)
        setPaymentSystem(initialPaymentSystem)
        setEnabled(props.method?.enabled ?? true)
        setParamsData(props.method?.params ?? [])
      }}>
      <Dialog.Trigger asChild={props.asChild} />
      <Portal>
        {toaster()}
        <Dialog.Backdrop class="fixed left-0 top-0 h-full w-full bg-hint1/15" />
        <Dialog.Positioner class="fixed left-0 top-0 flex h-full w-full flex-col items-center justify-center px-4 py-10">
          <Dialog.Content class="scrollbar-hide w-full max-w-[520px] overflow-y-auto rounded-card bg-fg p-4">
            <div class="mb-4 flex flex-row justify-between gap-4">
              <Dialog.Title class="ml-1.5 font-semibold">
                {props.new ? "Добавить способ оплаты" : "Изменить способ оплаты"}
              </Dialog.Title>
              <Dialog.CloseTrigger class="rounded-[8px]">
                <Icon icon={close} class="h-6 w-6 bg-text" />
              </Dialog.CloseTrigger>
            </div>

            <Show when={!props.new}>
              <div class="flex flex-row gap-2.5">
                <Button
                  class="gap-2.5 bg-error"
                  loading={isDeleteLoading()}
                  onClick={async () => {
                    setDeleteLoading(true)
                    await deletePaymentMethod(props.project.id, props.method!.id)
                    const newMethods = props.methods().reduce((filtered, method) => {
                      if (method.id === props.method!.id) return filtered
                      else
                        return [
                          ...filtered,
                          {
                            ...method,
                            position_index:
                              method.position_index > props.method!.position_index
                                ? method.position_index - 1
                                : method.position_index,
                          },
                        ]
                    }, [] as PaymentMethod[])
                    if (newMethods.length > 0) newMethods.find(method => method.position_index === 1)!.primary = true
                    props.setMethods(newMethods)
                    setIsOpen(false)
                  }}>
                  <Icon icon={trash} class="h-6 w-6 bg-text-on-primary" />
                  Удалить
                </Button>
                <button
                  class="flex w-full flex-row items-center justify-center gap-2.5 rounded-content py-4 font-semibold shadow-inside-border shadow-text"
                  onClick={() => setEnabled(v => !v)}>
                  <Show
                    when={enabled()}
                    fallback={
                      <>
                        <Icon icon={play} class="h-6 w-6 bg-text" />
                        Показать
                      </>
                    }>
                    <Icon icon={pause} class="h-6 w-6 bg-text" />
                    Скрыть
                  </Show>
                </button>
              </div>

              <div class="mt-4 px-1 text-card font-semibold">Способ оплаты</div>
            </Show>

            <Selector
              class="mt-2"
              name="Платежная система"
              value={() => paymentSystem()?.id.toString()}
              onSelect={v => setPaymentSystem(findPaymentSystem(+v))}
              items={props.paymentSystems.map(system => ({
                value: system.id.toString(),
                label: system.name,
              }))}
            />

            <div class="mt-2 grid grid-cols-[auto_1fr] gap-2">
              <IconSelector icons={props.icons} value={() => icon()} onSelect={setIcon} />
              <Input {...name.inputProps()} type="text" name="Название" />
            </div>

            <div class="mt-2 flex flex-row gap-2">
              <Input
                {...min_amount.inputProps()}
                type="number"
                name="Мин. сумма"
                onInput={v => {
                  min_amount.set(v)
                  if (max_amount.invalid()) max_amount.set(max_amount())
                }}
              />
              <Input
                {...max_amount.inputProps()}
                type="number"
                name="Макс. сумма"
                onInput={v => {
                  max_amount.set(v)
                  if (min_amount.invalid()) min_amount.set(min_amount())
                }}
              />
            </div>

            <Input {...commission.inputProps()} type="number" name="Комиссия, %" class="mt-2" />
            <Input {...min_commission_amount.inputProps()} type="number" name="Мин. комиссия, руб." class="mt-2" />

            <Show when={paymentSystem()?.method_params && paymentSystem()!.method_params.length > 0}>
              <div class="mb-2 mt-3 px-2 font-semibold">Тех. параметры</div>
              <div class="flex flex-col gap-2">
                <For each={paymentSystem()?.method_params}>
                  {param => <MethodParam param={param} paramsData={paramsData} setParamsData={setParamsData} />}
                </For>
              </div>
            </Show>

            <Button
              class="mt-4"
              loading={isLoading()}
              disabled={
                !areFieldsFilled(name, min_amount, max_amount, commission, min_commission_amount) ||
                !icon() ||
                !paramsFilled()
              }
              onClick={async () => {
                if (+min_amount() > +max_amount()) {
                  min_amount.invalidate()
                  max_amount.invalidate()
                  return
                }
                setLoading(true)
                if (!props.new) {
                  const resp = await updatePaymentMethod(props.project.id, props.method!.id, {
                    name: name(),
                    min_amount: +min_amount(),
                    max_amount: +max_amount(),
                    commission: +commission(),
                    min_commission_amount: +min_commission_amount(),
                    icon_id: icon()!.id,
                    payment_system_id: paymentSystem()!.id,
                    params: paramsData(),
                    enabled: enabled(),
                  })
                  if (!resp.success) {
                    setLoading(false)
                    // setErrorMessage(resp.error?.user_message ?? "Что-то пошло не так")
                    displayError(resp.error?.user_message ?? "Что-то пошло не так")
                    return
                  }

                  if (!resp.result.icon) resp.result.icon = props.icons.find(icon => resp.result.icon_id === icon.id)!

                  // props.method = resp.result
                  props.setMethods([...props.methods().filter(m => m.id !== props.method!.id), resp.result])
                } else {
                  const resp = await createPaymentMethod(props.project.id, {
                    name: name(),
                    min_amount: +min_amount(),
                    max_amount: +max_amount(),
                    commission: +commission(),
                    min_commission_amount: +min_commission_amount(),
                    icon_id: icon()!.id,
                    payment_system_id: paymentSystem()!.id,
                    params: paramsData(),
                    enabled: enabled(),
                  })
                  if (!resp.success) {
                    setLoading(false)
                    // setErrorMessage(resp.error?.user_message ?? "Что-то пошло не так")
                    displayError(resp.error?.user_message ?? "Что-то пошло не так")
                    return
                  }

                  if (!resp.result.icon) resp.result.icon = props.icons.find(icon => resp.result.icon_id === icon.id)!

                  if (props.methods().length > 0) {
                    props.setMethods([...props.methods(), resp.result])
                  } else {
                    props.setMethods([resp.result])
                  }
                }
                setIsOpen(false)
              }}>
              Сохранить
            </Button>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

type IconSelectorProps = {
  icons: Icon[]
  value: Accessor<Icon | undefined>
  onSelect: (icon: Icon) => void
}

function IconSelector(props: IconSelectorProps) {
  const [isOpen, setOpen] = createSignal(false)

  return (
    <Select.Root
      open={isOpen()}
      onOpenChange={({ open }) => setOpen(open)}
      items={props.icons}
      onValueChange={v => props.onSelect(props.icons.find(icon => icon.id === +v.value[0])!)}
      value={props.value ? (props.value() ? [props.value()!.id.toString()] : []) : undefined}
      itemToValue={icon => `${icon.id}`}>
      <Select.Control class="h-full w-full">
        <Select.Trigger class="relative flex h-full w-full flex-row items-center gap-1 rounded-content bg-hint2/15 p-2">
          <Show
            when={props.value()}
            fallback={<Icon icon={selectIcon} class="h-[calc(1rem+1.2em)] w-[calc(1rem+1.2em)] bg-text" />}>
            <IconDisplay icon={props.value()!} class="h-[calc(1rem+1.2em)] w-[calc(1rem+1.2em)]" />
          </Show>
          <Select.Indicator>
            <Icon
              icon={arrow}
              class={"h-6 w-6 bg-text transition-transform duration-150 " + (isOpen() ? "rotate-90" : "-rotate-90")}
            />
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Select.Positioner>
        <Select.Content class="z-10 grid grid-cols-4 overflow-hidden rounded-content bg-fg p-3 shadow-menu focus:outline-none">
          <Index each={props.icons}>
            {item => (
              <Select.Item item={item()} class="cursor-pointer rounded-[8px] p-1 data-[highlighted]:bg-text/10">
                <IconDisplay icon={item()} class="aspect-square h-9" />
              </Select.Item>
            )}
          </Index>
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  )
}

function MethodParam({
  param,
  paramsData,
  setParamsData,
}: {
  param: MethodParam
  paramsData: Accessor<ParamData[]>
  setParamsData: Setter<ParamData[]>
}) {
  const initialParam = paramsData().find(p => p.param_id === param.id)

  return (
    <Switch>
      <Match when={param.type === "boolean"}>
        <CheckBox
          name={param.name}
          checked={initialParam?.value as boolean | undefined}
          onCheck={checked =>
            setParamsData(
              paramsData()
                .filter(p => p.param_id !== param.id)
                .concat({
                  param_id: param.id,
                  value: checked,
                })
            )
          }
        />
      </Match>
      <Match when={param.type === "enum"}>
        <Selector
          name={param.name}
          defaultValue={initialParam?.value as string | undefined}
          onSelect={value =>
            setParamsData(
              paramsData()
                .filter(p => p.param_id !== param.id)
                .concat({
                  param_id: param.id,
                  value,
                })
            )
          }
          items={param.enum.map(v => ({
            value: v,
            label: v,
          }))}
        />
      </Match>
      <Match when={param.type === "int"}>
        {(() => {
          const [value, setValue] = createSignal(initialParam?.value ? initialParam!.value.toString() : "")

          return (
            <Input
              name={param.name}
              type="tel"
              value={value()}
              onInput={(v, e) => {
                if (/^\d*$/.test(v)) {
                  setValue(v)
                  setParamsData(
                    paramsData()
                      .filter(p => p.param_id !== param.id)
                      .concat({
                        param_id: param.id,
                        value: +value(),
                      })
                  )
                } else (e.target as HTMLInputElement).value = value()
              }}
            />
          )
        })()}
      </Match>
      <Match when={param.type === "float"}>
        <Input
          name={param.name}
          value={initialParam?.value as number | undefined}
          type="number"
          onInput={v =>
            setParamsData(
              paramsData()
                .filter(p => p.param_id !== param.id)
                .concat({
                  param_id: param.id,
                  value: +v,
                })
            )
          }
        />
      </Match>
      <Match when={param.type === "string"}>
        <Input
          name={param.name}
          type="text"
          value={initialParam?.value as string | undefined}
          onInput={value =>
            setParamsData(
              paramsData()
                .filter(p => p.param_id !== param.id)
                .concat({
                  param_id: param.id,
                  value,
                })
            )
          }
        />
      </Match>
    </Switch>
  )
}
