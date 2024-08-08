import { createEffect } from "solid-js"
import { updateFooterText, updateSupportUrl } from "~/api"
import Input from "~/components/input"
import { createDebouncedSaver, isValidUrl } from "~/utilities"

export default function PaymentTab(props: { project: Project }) {
  let lastProjectId = props.project.id
  const supportUrl = createDebouncedSaver(props.project.support_url, isValidUrl, updateSupportUrl(props.project.id))
  const footerText = createDebouncedSaver(
    props.project.footer_text,
    (value: string) => value.length > 5,
    updateFooterText(props.project.id)
  )

  createEffect(() => {
    if (props.project.id === lastProjectId) return
    supportUrl.reset(props.project.support_url, updateSupportUrl(props.project.id))
    footerText.reset(props.project.footer_text, updateFooterText(props.project.id))
    lastProjectId = props.project.id
  })

  return (
    <>
      <div class="px-2 text-sm sm:text-card">
        Настройка контента на странице оплаты: отображение способов оплаты, ссылки и текст
      </div>
      <div class="mb-1 mt-4 px-2">Ссылки</div>
      <Input type="text" name="Поддержка" invalidDescription="Введите правильный URL" {...supportUrl()} />
      <div class="mb-1 mt-3 px-2">Текст</div>
      <Input multiline type="text" name="Подвал" invalidDescription="Введите не менее 6 символов" {...footerText()} />
    </>
  )
}
