import { Dialog, PolymorphicProps, Select } from "@ark-ui/solid"
import {
  CollisionDetector,
  createDroppable,
  createSortable,
  DragDropProvider,
  DragDropSensors,
  DragEventHandler,
  Draggable,
  DragOverlay,
  Droppable,
  mostIntersecting,
  SortableProvider,
  transformStyle,
} from "@thisbeyond/solid-dnd"
import { Accessor, batch, createSignal, For, Index, JSX, onCleanup, onMount, Setter, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { Portal } from "solid-js/web"
import add from "~/assets/add.svg"
import check from "~/assets/check.svg"
import close from "~/assets/close.svg"
import drag from "~/assets/drag.svg"
import pause from "~/assets/pause.svg"
import rearrange from "~/assets/rearrange.svg"
import sbpImg from "~/assets/sbp.svg"
import trash from "~/assets/trash.svg"
import { GoCardBtn, GoCardInsides } from "~/components/gocard"
import Icon from "~/components/icon"
import Input from "~/components/input"
import Selector from "~/components/selector"
import { ICONS } from "~/mocked-data"
import arrow from "~/assets/arrow.svg"
import selectIcon from "~/assets/select-icon.svg"
import Button from "~/components/button"

const sbpIcon: Icon = {
  id: 1,
  url: sbpImg,
  name: "sbp",
}

function MethodCard(props: { method: PaymentMethod } & JSX.IntrinsicElements["button"]) {
  return (
    <GoCardBtn
      icon={<img src={props.method.icon.url} class="h-6 w-6" />}
      description={"props.method.description"}
      title={props.method.name}
      class="flex-grow rounded-content bg-hint2/15"
      {...props}
    />
  )
}

function SortableMethodCard(props: { item: number; methods: Accessor<PaymentMethod[]>; noDrag?: boolean }) {
  const sortable = createSortable(props.item)
  const method = props.methods().find(method => method.id === props.item)!

  return (
    <div
      ref={sortable.ref}
      style={transformStyle(sortable.transform)}
      class="flex flex-grow touch-none select-none flex-row items-center gap-3 rounded-content bg-hint2/15 px-4 py-3.5"
      classList={{ "opacity-25": sortable.isActiveDraggable }}
      {...(props.noDrag ? {} : sortable.dragActivators)}>
      <GoCardInsides
        icon={<img src={method.icon.url} class="h-6 w-6" />}
        description={"method.description"}
        title={method.name}>
        <Icon icon={drag} class={"h-6 w-6 " + (props.noDrag ? "bg-hint2" : "bg-text")} />
      </GoCardInsides>
    </div>
  )
}

function PrimaryDroppable(props: { items: number[]; methods: Accessor<PaymentMethod[]> }) {
  const droppable = createDroppable("primary")

  return (
    <div ref={droppable.ref} class="flex flex-col gap-3">
      <SortableProvider ids={props.items}>
        <For each={props.items}>
          {item => <SortableMethodCard item={item} methods={props.methods} noDrag={props.items.length === 1} />}
        </For>
      </SortableProvider>
    </div>
  )
}

function SecondaryDroppable(props: { items: number[]; methods: Accessor<PaymentMethod[]> }) {
  const droppable = createDroppable("secondary")

  return (
    <div ref={droppable.ref} class="flex flex-col gap-3">
      <SortableProvider ids={props.items}>
        <For
          each={props.items}
          fallback={(() => {
            let div: HTMLDivElement | undefined

            onMount(() => document.getElementById("main")?.scrollBy(0, div?.getBoundingClientRect().height! + 12))
            onCleanup(() => document.getElementById("main")?.scrollBy(0, -(div?.getBoundingClientRect().height! + 12)))

            return (
              <div
                ref={div}
                class="dashed flex flex-grow flex-row items-center justify-center rounded-content px-4 py-3.5 text-center text-sm font-semibold text-hint2">
                Чтобы сделать способ скрытым, переместите его сюда
              </div>
            )
          })()}>
          {item => <SortableMethodCard item={item} methods={props.methods} />}
        </For>
      </SortableProvider>
    </div>
  )
}

function MethodsEdit({
  ref,
  sortedMethods,
  setSaver,
}: {
  ref: Setter<HTMLDivElement | undefined>
  sortedMethods: Accessor<PaymentMethod[]>
  setSaver: Setter<(cb: (primaryIds: number[], secondaryIds: number[]) => void) => void>
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
        <PrimaryDroppable methods={sortedMethods} items={containers.primary} />
        <div class="mb-1.5 mt-3 select-none px-2 text-card font-semibold">Скрытые способы:</div>
        <SecondaryDroppable methods={sortedMethods} items={containers.secondary} />
      </div>
      <DragOverlay>
        {draggable => {
          const method = sortedMethods().find(method => method.id === draggable?.id)
          if (!method) return null
          return (
            <div class="flex flex-grow touch-none flex-row items-center gap-3 rounded-content bg-fg bg-hint2/15 px-4 py-3.5">
              <GoCardInsides
                icon={<img src={method.icon.url} class="h-6 w-6" />}
                description={"method.description"}
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

export default function MethodsTab() {
  const [isEditing, setIsEditing] = createSignal(false)
  const [methods, setMethods] = createSignal<PaymentMethod[]>([
    {
      id: 3,
      name: "Карта 3",
      icon: sbpIcon,
      position_index: 3,
      primary: true,
      min_amount: 10,
      max_amount: 100,
      commission: 15,
      min_commission_amount: 10,
    },
    {
      id: 2,
      name: "Карта 2",
      icon: sbpIcon,
      position_index: 2,
      primary: true,
      min_amount: 10,
      max_amount: 100,
      commission: 15,
      min_commission_amount: 10,
    },
    {
      id: 1,
      name: "Карта asdasd",
      icon: sbpIcon,
      position_index: 1,
      primary: true,
      min_amount: 10,
      max_amount: 100,
      commission: 15,
      min_commission_amount: 10,
    },
    {
      id: 4,
      name: "Карта 4",
      icon: sbpIcon,
      position_index: 4,
      primary: false,
      min_amount: 10,
      max_amount: 100,
      commission: 15,
      min_commission_amount: 10,
    },
    {
      id: 5,
      name: "Карта 5",
      icon: sbpIcon,
      position_index: 5,
      primary: false,
      min_amount: 10,
      max_amount: 100,
      commission: 15,
      min_commission_amount: 10,
    },
    {
      id: 6,
      name: "Карта 6",
      icon: sbpIcon,
      position_index: 6,
      primary: false,
      min_amount: 10,
      max_amount: 100,
      commission: 15,
      min_commission_amount: 10,
    },
    {
      id: 7,
      name: "Карта 7",
      icon: sbpIcon,
      position_index: 7,
      primary: false,
      min_amount: 10,
      max_amount: 100,
      commission: 15,
      min_commission_amount: 10,
    },
  ])
  const sortedMethods = () => methods().sort((a, b) => a.position_index - b.position_index)
  const [saver, setSaver] = createSignal<(cb: (primaryIds: number[], secondaryIds: number[]) => void) => void>(cb =>
    cb([], [])
  )
  const [editorRef, setEditorRef] = createSignal<HTMLDivElement>()

  return (
    <>
      <div class="mb-5 px-2 text-sm sm:text-card">
        <p>Добавьте способы оплаты и измените их порядок отображения на странице оплаты</p>
        <p>Максимальное число способов оплаты - 8</p>
      </div>

      <Show
        when={isEditing()}
        fallback={
          <button
            class="mb-3 flex flex-row items-center gap-2.5 px-2"
            onClick={() => {
              setIsEditing(true)
              setTimeout(() => editorRef()?.scrollIntoView({ behavior: "smooth" }), 0)
            }}>
            <Icon icon={rearrange} class="h-6 w-6 bg-text" />
            <div class="font-semibold">Изменить порядок</div>
          </button>
        }>
        <button
          class="mb-3 flex flex-row gap-2 rounded-content bg-primary p-2 pr-3 text-text-on-primary"
          onClick={() => {
            saver()!((primaryIds, secondaryIds) => {
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
              setMethods([...methods])
            })
            setIsEditing(false)
          }}>
          <Icon icon={check} class="h-6 w-6 bg-text-on-primary" />
          <div class="font-semibold">Сохранить</div>
        </button>
      </Show>

      <Show
        when={isEditing()}
        fallback={
          <div class="flex flex-wrap gap-3">
            <Index each={sortedMethods()}>
              {item => (
                <EditMethodDialog
                  method={item()}
                  methods={methods}
                  setMethods={setMethods}
                  asChild={props => <MethodCard method={item()} {...props} />}
                />
              )}
            </Index>
            <Show when={methods().length < 8}>
              <EditMethodDialog
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
        <MethodsEdit ref={setEditorRef} sortedMethods={sortedMethods} setSaver={setSaver} />
      </Show>
    </>
  )
}

function EditMethodDialog(
  props: PolymorphicProps<"button"> & {
    methods: Accessor<PaymentMethod[]>
    setMethods: Setter<PaymentMethod[]>
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
  const [name, setName] = createSignal(props.method?.name ?? "")
  const [minAmount, setMinAmount] = createSignal(props.method?.min_amount ?? "")
  const [maxAmount, setMaxAmount] = createSignal(props.method?.max_amount ?? "")
  const [commission, setCommission] = createSignal(props.method?.commission ?? "")
  const [minCommissionAmount, setMinCommissionAmount] = createSignal(props.method?.min_commission_amount ?? "")

  return (
    <Dialog.Root
      closeOnInteractOutside={false}
      onOpenChange={({ open }) => setIsOpen(open)}
      open={isOpen()}
      onExitComplete={() => {
        setName(props.method?.name ?? "")
        setMinAmount(props.method?.min_amount ?? "")
        setMaxAmount(props.method?.max_amount ?? "")
        setCommission(props.method?.commission ?? "")
        setMinCommissionAmount(props.method?.min_commission_amount ?? "")
      }}>
      <Dialog.Trigger asChild={props.asChild} />
      <Portal>
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
                <button
                  class="flex w-full flex-row items-center justify-center gap-2.5 rounded-content bg-error py-4 font-semibold text-text-on-primary"
                  onClick={() => {
                    props.setMethods(props.methods().filter(method => method.id !== props.method!.id))
                    setIsOpen(false)
                  }}>
                  <Icon icon={trash} class="h-6 w-6 bg-text-on-primary" />
                  Удалить
                </button>
                <button class="flex w-full flex-row items-center justify-center gap-2.5 rounded-content py-4 font-semibold shadow-inside-border shadow-text">
                  <Icon icon={pause} class="h-6 w-6 bg-text" />
                  <div class="">Скрыть</div>
                </button>
              </div>

              <div class="mt-4 px-1 text-card font-semibold">Способ оплаты</div>
            </Show>

            <Selector
              class="mt-2"
              name="Платежная система"
              items={[
                {
                  value: "1",
                  label: "хуйня",
                },
                {
                  value: "2",
                  label: "ещё хуйня",
                },
                {
                  value: "3",
                  label: "все хуйня",
                },
              ]}
            />

            <div class="mt-2 grid grid-cols-[auto_1fr] gap-2">
              <IconSelector />
              <Input invalid={name().length < 10} type="text" name="Название" value={name()} onInput={setName} />
            </div>

            <div class="mt-2 flex flex-row gap-2">
              <Input type="number" name="Мин. сумма" value={minAmount()} onInput={setMinAmount} class="" />
              <Input type="number" name="Макс. сумма" value={maxAmount()} onInput={setMaxAmount} class="" />
            </div>

            <Input type="number" name="Комиссия, %" value={commission()} onInput={setCommission} class="mt-2" />
            <Input
              type="number"
              name="Мин. комиссия, руб."
              value={minCommissionAmount()}
              onInput={setMinCommissionAmount}
              class="mt-2"
            />

            <Button
              class="mt-4"
              onClick={() => {
                if (!props.new) {
                  props.setMethods(
                    props.methods().map(m => {
                      if (m.id !== props.method!.id) return m
                      return {
                        ...m,
                        name: name(),
                        min_amount: +minAmount(),
                        max_amount: +maxAmount(),
                        commission: +commission(),
                        min_commission_amount: +minCommissionAmount(),
                      }
                    })
                  )
                } else {
                  props.setMethods([
                    ...props.methods().map(m => ({
                      ...m,
                      position_index: m.position_index + 1,
                    })),
                    {
                      id: Math.max(...props.methods().map(m => m.id)) + 1,
                      name: name(),
                      min_amount: +minAmount(),
                      max_amount: +maxAmount(),
                      commission: +commission(),
                      min_commission_amount: +minCommissionAmount(),
                      primary: true,
                      position_index: 1,
                      icon: sbpIcon,
                    },
                  ])
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
  defaultId?: number
  onSelect?: (icon: Icon) => void
}

function IconSelector(props: IconSelectorProps) {
  const [isOpen, setOpen] = createSignal(false)
  const [selectedIcon, setSelectedIcon] = createSignal(
    props.defaultId ? ICONS.find(icon => icon.id === props.defaultId)! : undefined
  )

  return (
    <Select.Root
      open={isOpen()}
      onOpenChange={({ open }) => setOpen(open)}
      items={ICONS}
      // positioning={{ sameWidth: true }}
      onValueChange={v => {
        const icon = ICONS.find(icon => icon.id === +v.value[0])!
        setSelectedIcon(icon)
        props.onSelect?.(icon)
      }}
      defaultValue={props.defaultId ? [`${props.defaultId}`] : undefined}
      itemToValue={icon => `${icon.id}`}>
      <Select.Control class="h-full w-full">
        <Select.Trigger class="relative flex h-full w-full flex-row items-center gap-1 rounded-content bg-hint2/15 p-2">
          <Show
            when={selectedIcon()}
            fallback={<Icon icon={selectIcon} class="aspect-square h-[calc(100%-0.25rem)] bg-text" />}>
            <img src={selectedIcon()!.url} alt="" class="aspect-square h-[calc(100%-0.25rem)]" />
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
          <Index each={ICONS}>
            {item => (
              <Select.Item item={item()} class="cursor-pointer rounded-[8px] p-2 data-[highlighted]:bg-text/10">
                <img src={item().url} alt="" class="aspect-square h-full" />
              </Select.Item>
            )}
          </Index>
        </Select.Content>
      </Select.Positioner>
    </Select.Root>
  )
}
