import { debounce } from "@solid-primitives/scheduled"
import { Accessor, createSignal, Match, Setter, Show, Switch } from "solid-js"
import checkmark_animated from "./assets/checkmark-animated.svg"
import hidePassword from "./assets/hide-password.svg"
import showPassword from "./assets/show-password.svg"
import spinner from "./assets/spinner.svg"
import Icon from "./components/icon"

const formatter = new Intl.NumberFormat("ru")

export const formatNumber = formatter.format

const getNonDigitAmount = (x: string) => x.replace(/[0-9]/g, "").length

const removeThousandSeparators = (x: any) =>
  x.toString().replaceAll(" ", String.fromCharCode(160)).replaceAll(thousandSeparator, "")

const thousandSeparator = formatNumber(1000).replace(/[0-9]/g, "")

const commaSeparator = formatNumber(0.01).replace(/[0-9]/g, "")

export const createFormatHandler = (setter: Setter<string>, input: () => HTMLDivElement) => {
  let currentValue: string

  return () => {
    let cursorPosition = getCaretPosition(input())
    let valueBefore = input().innerText
    let digitsBefore = getNonDigitAmount(input().innerText)
    let number = removeThousandSeparators(input().textContent!)

    if (input().innerText == "") return

    input().innerText = formatNumber(number.replace(commaSeparator, "."))

    // if deleting the comma, delete it correctly
    if (
      currentValue == input().innerText &&
      currentValue == valueBefore.substr(0, cursorPosition) + thousandSeparator + valueBefore.substr(cursorPosition)
    ) {
      input().innerText = formatNumber(
        removeThousandSeparators(valueBefore.substr(0, cursorPosition - 1) + valueBefore.substr(cursorPosition))
      )
      cursorPosition--
    }

    // if entering comma for separation, leave it in there (as well support .000)
    if (
      valueBefore.endsWith(commaSeparator) ||
      valueBefore.endsWith(commaSeparator + "0") ||
      valueBefore.endsWith(commaSeparator + "00") ||
      valueBefore.endsWith(commaSeparator + "000")
    ) {
      input().innerText = input().innerText + valueBefore.substring(valueBefore.indexOf(commaSeparator))
    }

    // move cursor correctly if thousand separator got added or removed
    let digitsAfter = getNonDigitAmount(input().innerText)
    if (digitsBefore !== digitsAfter) cursorPosition += digitsAfter - digitsBefore

    setCaretPosition(input(), cursorPosition)

    if (input().innerText === "0") input().innerText = ""
    setter(removeThousandSeparators(input().innerText))
    currentValue = input().innerText
  }
}

function getCaretPosition(editable: HTMLDivElement) {
  let caretPos = 0
  const sel = window.getSelection()
  if (sel?.rangeCount) {
    const range = sel.getRangeAt(0)
    if (range.commonAncestorContainer.parentNode == editable) {
      caretPos = range.endOffset
    }
  }

  return caretPos
}

function setCaretPosition(elem: HTMLElement, pos: number) {
  const range = document.createRange()
  const sel = window.getSelection()
  if (pos < 0) pos = 0
  if (!sel || pos > (elem.childNodes[0].textContent?.length ?? 0)) return console.error("Selection outside of range")

  range.setStart(elem.childNodes[0], pos)
  range.collapse(true)

  sel.removeAllRanges()
  sel.addRange(range)
}

export function createDebouncedSaver<T>(
  initial: T,
  predicate: (value: T) => boolean,
  saveCb: (value: T) => Promise<boolean>
) {
  const [value, setValue] = createSignal(initial)
  const [isInvalid, setInvalid] = createSignal(false)
  const [loadingState, setLoadingState] = createSignal<"idle" | "loading" | "finished">("idle", { equals: false })
  const triggerValidity = debounce((matches: boolean) => {
    if (!matches) setInvalid(true)
  }, 500)
  const trigger = debounce(async (value: T, matches: boolean) => {
    if (matches) {
      console.log("triggered", value, loadingState())
      setLoadingState("loading")
      const successful = await saveCb(value)
      console.log("updated:", successful)
      setLoadingState("finished")
      if (!successful) {
        setLoadingState("idle")
        setInvalid(true)
      } else {
        setLoadingState("finished")
        setTimeout(() => setLoadingState("idle"), 2000)
      }
    }
  }, 1500)

  const append = (
    <Switch>
      <Match when={loadingState() === "loading"}>
        <Icon icon={spinner} class="h-6 w-6 bg-hint2" />
      </Match>
      <Match when={loadingState() === "finished"}>
        <Icon icon={checkmark_animated} class="h-6 w-6 bg-hint2" />
      </Match>
    </Switch>
  )

  return Object.assign(
    () => ({
      value: value(),
      invalid: isInvalid(),
      onInput: (value: T) => {
        setValue(_ => value)
        const matches = predicate(value)
        if (isInvalid() && matches) setInvalid(false)
        triggerValidity(matches)
        trigger(value, matches)
      },
      append,
    }),
    {
      reset: (newInitial: T, newSaveCb: (value: T) => Promise<boolean>) => {
        setValue(_ => newInitial)
        setInvalid(false)
        setLoadingState("idle")
        trigger.clear()
        triggerValidity.clear()
        saveCb = newSaveCb
      },
    }
  )
}

export type Field<T> = Accessor<T> & {
  set(value: T): void
  onFocusOut: () => void
  invalid: Accessor<boolean>
  isValid: () => boolean
  invalidate: () => void
  reset: () => void
  inputProps: () => {
    onInput: (value: T) => void
    invalid: boolean
    onFocusOut: () => void
    value: T
  }
}

export function createValidatedField<T>(predicate: (value: T) => boolean, initial: T): Field<T> {
  const [value, setValue] = createSignal(initial)
  const [isInvalid, setInvalid] = createSignal(false)

  const methods = {
    set(value: T) {
      setValue(_ => value)
      setInvalid(isInvalid() && !predicate(value))
    },
    onFocusOut: () => {
      setInvalid(!predicate(value()))
    },
    invalid: isInvalid,
    isValid: () => predicate(value()) && !isInvalid(),
    invalidate: () => setInvalid(true),
    reset: () => {
      setValue(_ => initial)
      setInvalid(false)
    },
  }

  return Object.assign(value, methods, {
    inputProps: () => ({
      onInput: methods.set,
      invalid: methods.invalid(),
      onFocusOut: methods.onFocusOut,
      value: value(),
    }),
  })
}

export const areFieldsFilled = (...fields: Field<any>[]) => fields.every(f => f.isValid())
export const resetFields = (...fields: Field<any>[]) => fields.forEach(f => f.reset())

export function analyzePassword(password: string) {
  const upperCaseRegex = /^[A-Z]$/
  const lowerCaseRegex = /^[a-z]$/
  const numberRegex = /^[0-9]$/
  const symbolRegex = /^[-#!$@£%^&*()_+|~=`{}\[\]:";'<>?,.\/\\ ]$/

  let charMap = new Map<string, number>()
  Array.from(password).forEach(char => {
    if (charMap.has(char)) charMap.set(char, charMap.get(char)! + 1)
    else charMap.set(char, 1)
  })

  let analysis = {
    length: password.length,
    uniqueChars: charMap.keys.length,
    uppercaseCount: 0,
    lowercaseCount: 0,
    numberCount: 0,
    symbolCount: 0,
  }
  charMap.forEach((count, char) => {
    if (upperCaseRegex.test(char)) analysis.uppercaseCount += count
    else if (lowerCaseRegex.test(char)) analysis.lowercaseCount += count
    else if (numberRegex.test(char)) analysis.numberCount += count
    else if (symbolRegex.test(char)) analysis.symbolCount += count
  })

  const hasLength = analysis.length >= 8
  const hasLowercase = analysis.lowercaseCount >= 1
  const hasUppercase = analysis.uppercaseCount >= 1
  const hasDigit = analysis.numberCount >= 1
  const hasSymbols = analysis.symbolCount >= 1

  return {
    secure: hasLength && hasLowercase && hasUppercase && hasDigit && hasSymbols,
    hasLength,
    hasLowercase,
    hasUppercase,
    hasDigit,
    hasSymbols,
  }
}

export function createPasswordShower() {
  const [type, setType] = createSignal<"password" | "text">("password")

  const append = (
    <button onClick={() => setType(_ => (type() === "password" ? "text" : "password"))}>
      <Show when={type() === "text"} fallback={<Icon icon={hidePassword} class="h-6 w-6 bg-primary" />}>
        <Icon icon={showPassword} class="h-6 w-6 bg-primary" />
      </Show>
    </button>
  )

  return () => ({
    type: type(),
    append,
  })
}

export const mainScrollable = () => document.getElementById("main")!

export const isValidPath = (link: string) => link.length >= 3 && link.length <= 30 && /^[a-zA-Z0-9-_]+$/.test(link)

const urlRegex =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/

export const isValidUrl = (value: string) => urlRegex.test(value)

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]+$/
export const isValidEmail = (value: string) => emailRegex.test(value)

export function isObjectEmpty(obj: object) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) return false
  }

  return true
}
