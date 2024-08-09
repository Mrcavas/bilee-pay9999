import { A, useNavigate } from "@solidjs/router"
import { Show, createSignal, onMount } from "solid-js"
import { tryLogin } from "~/api"
import { MainLayout } from "~/app"
import Button from "~/components/button"
import Input from "~/components/input"
import { areFieldsFilled, createPasswordShower, createValidatedField, isValidEmail } from "~/utilities"

export default function Login() {
  const navigate = useNavigate()
  const [isLoading, setLoading] = createSignal(false)
  const email = createValidatedField<string>(isValidEmail, "")
  const password = createValidatedField<string>(v => !!v, "")
  const [errorMessage, setErrorMessage] = createSignal("")
  const passwordShowerProps = createPasswordShower()

  return (
    <MainLayout noFooter class="max-w-[500px]">
      <div class="flex h-11 w-full shrink flex-row items-center justify-center gap-2">
        <img src="/bilee.svg" class="h-11" />
        <div class="text-md font-semibold">
          <span class="text-primary">Bilee</span> Bots
        </div>
      </div>
      <div class="mt-4 flex w-full flex-col items-center rounded-card bg-fg p-4 sm:mb-[3.75rem]">
        <div class="mb-2 text-center font-semibold">Личный кабинет</div>
        <Show when={errorMessage()}>
          <div class="mt-1 w-full text-center text-sm text-error">{errorMessage()}</div>
        </Show>
        <Input {...email.inputProps()} type="email" name="Email" class="mt-1" />
        <Input {...password.inputProps()} {...passwordShowerProps()} name="Пароль" class="mt-2" />

        <Button
          class="mt-4"
          loading={isLoading()}
          disabled={!areFieldsFilled(email, password)}
          onClick={async () => {
            setLoading(true)
            const res = await tryLogin(email(), password())
            if (res === true) navigate("/lk")
            else {
              setLoading(false)
              if (res === "INVALID_LOGIN_CREDS") {
                email.invalidate()
                password.invalidate()
                setErrorMessage("Неверная почта или пароль")
              } else {
                setErrorMessage("Что-то пошло не так")
              }
            }
          }}>
          Войти
        </Button>
        <A href="/lk/register" class="mt-3 text-sm font-semibold text-primary underline">
          Регистрация
        </A>
      </div>
    </MainLayout>
  )
}
