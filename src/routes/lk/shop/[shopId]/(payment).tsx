import Input from "~/components/input"
import { createDebouncedSaver, isValidUrl } from "~/utilities"

export default function PaymentTab() {
  const [isSupportUrlInvalid, onSupportUrlInput, supportIndicator] = createDebouncedSaver(isValidUrl, async v => {
    await new Promise(r => setTimeout(r, 1000))
    return true
  })
  const [isFooterTextInvalid, onFooterTextInput, footerTextIndicator] = createDebouncedSaver(
    (value: string) => value.length > 5,
    async v => {
      await new Promise(r => setTimeout(r, 1000))
      return true
    }
  )

  return (
    <>
      <div class="px-2 text-sm sm:text-card">
        Настройка контента на странице оплаты: отображение способов оплаты, ссылки и текст
      </div>
      <div class="mb-1 mt-4 px-2">Ссылки</div>
      <Input
        invalid={isSupportUrlInvalid()}
        type="text"
        name="Поддержка"
        onInput={onSupportUrlInput}
        invalidDescription="Введите правильный URL"
        append={supportIndicator}
      />
      <div class="mb-1 mt-3 px-2">Текст</div>
      <Input
        invalid={isFooterTextInvalid()}
        multiline
        type="text"
        name="Подвал"
        onInput={onFooterTextInput}
        invalidDescription="Введите не менее 6 символов"
        append={footerTextIndicator}
      />
    </>
  )
}
