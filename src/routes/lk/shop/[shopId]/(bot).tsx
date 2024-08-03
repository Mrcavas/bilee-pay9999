import IdCard from "~/components/idcard"
import Input from "~/components/input"
import Selector from "~/components/selector"

export default function BotTab() {
  return (
    <>
      <div class="px-2 text-sm sm:text-card">
        <p>Для корректной работы сервиса нам требуется токен Вашего бота</p>
        <p>Мы используем его только для получения данных о пользователе, когда он вводит свой ID на сайте</p>
      </div>
      <div class="mt-4 grid gap-2 sm:grid-cols-2">
        <Input type="text" name="Token" class="" />
        <IdCard avatar="/avatar.jpg" title="Test Bot" subtitle="@test_bot" class="" />
      </div>
    </>
  )
}
