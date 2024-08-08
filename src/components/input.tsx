import { createUniqueId, JSX, ParentComponent, Show, splitProps } from "solid-js"
import { twMerge } from "tailwind-merge"
import "./input.css"

type InputProps = {
  name: string
  append?: JSX.Element
  invalid?: boolean
  centerLabel?: boolean
  multiline?: boolean
  description?: string
  invalidDescription?: string
  onInput?: (input: string) => void
}

const Input: ParentComponent<Omit<JSX.IntrinsicElements["input"], "onInput"> & InputProps> = props => {
  const id = createUniqueId()
  const [local, inputProps] = splitProps(props, [
    "name",
    "append",
    "invalid",
    "centerLabel",
    "id",
    "onInput",
    "multiline",
    "description",
    "invalidDescription",
  ])

  return (
    <label
      for={local.id ?? id}
      class={
        twMerge(
          "input-container cursor-text relative flex w-full flex-row justify-between rounded-content px-[21px] pb-2 pt-6 transition-all",
          inputProps.disabled && "text-hint1",
          props.class
        ) + (local.invalid ? " bg-error/10 shadow-inside-border shadow-error" : " bg-hint2/15")
      }
      title={local.invalid ? local.invalidDescription : local.description}>
      <Show
        when={local.multiline}
        fallback={
          <>
            <input
              {...inputProps}
              id={local.id ?? id}
              class="w-full bg-transparent outline-none"
              required
              title=""
              placeholder={" "}
              onInput={e => {
                local.onInput?.(e.target.value)
              }}
            />
            <label for={local.id ?? id} class="floating-label">
              {local.name}
            </label>
          </>
        }>
        <div class="textarea-container" data-replicated-value={props.value}>
          <textarea
            id={local.id ?? id}
            rows={1}
            class="w-full bg-transparent outline-none"
            required
            title=""
            placeholder={" "}
            onInput={e => {
              ;(e.target.parentNode as HTMLDivElement).dataset.replicatedValue = e.target.value
              local.onInput?.(e.target.value)
            }}>
            {props.value}
          </textarea>
          <label for={local.id ?? id} class="floating-label">
            {local.name}
          </label>
        </div>
      </Show>
      <div class="-mt-2 pl-2">{local.append}</div>
    </label>
  )
}

export default Input
