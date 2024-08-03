import { A, useNavigate } from "@solidjs/router"
import { createEffect, createSignal, Show } from "solid-js"
import { tryLogin } from "~/api"
import { MainLayout } from "~/app"
import Button from "~/components/button"
import Input from "~/components/input"
import { analyzePassword, areFieldsFilled, createPasswordShower, createValidatedField, isValidEmail } from "~/utilities"
import listCheck from "~/assets/list-check.svg"
import listBullet from "~/assets/list-bullet.svg"
import Icon from "~/components/icon"

function ListItem(props: { checked: boolean; text: string }) {
  return (
    <div class={"flex flex-row items-center gap-1 " + (props.checked ? "text-success" : "")}>
      <Show when={props.checked} fallback={<Icon icon={listBullet} class="mb-[-0.1875rem] h-4 w-4 bg-text" />}>
        <Icon icon={listCheck} class="h-4 w-4 bg-success" />
      </Show>

      {props.text}
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [isLoading, setLoading] = createSignal(false)
  const email = createValidatedField<string>(isValidEmail, "")
  const password = createValidatedField<string>(v => analyzePassword(v).secure, "")
  const passwordAnalysis = () => analyzePassword(password())
  const [secondPassword, setSecondPassword] = createSignal("")
  const [errorMessage, setErrorMessage] = createSignal("")
  const passwordShowerProps = createPasswordShower()
  const secondaryPasswordShowerProps = createPasswordShower()

  return (
    <MainLayout noFooter class="max-w-[500px]">
      <div class="flex h-11 w-full shrink flex-row items-center justify-center gap-2">
        <img src="/bilee.svg" class="h-11" />
        <div class="text-md font-semibold">
          <span class="text-primary">Bilee</span> Bots
        </div>
      </div>
      <div class="mt-4 flex w-full flex-col items-center rounded-card bg-fg p-4 sm:mb-[3.75rem]">
        <div class="mb-2 text-center font-semibold">Регистрация</div>
        <Show when={errorMessage()}>
          <div class="mt-1 w-full text-center text-sm text-error">{errorMessage()}</div>
        </Show>
        <Input {...email.inputProps()} type="email" name="Email" class="mt-1" />
        <Input
          {...password.inputProps()}
          {...passwordShowerProps()}
          name="Пароль"
          class="mt-2"
          autocomplete="new-password"
        />

        <div class="mt-1 self-start px-2 text-sm">
          <ListItem checked={passwordAnalysis().hasLowercase} text="строчная буква" />
          <ListItem checked={passwordAnalysis().hasUppercase} text="заглавная буква" />
          <ListItem checked={passwordAnalysis().hasDigit} text="цифра" />
          <ListItem checked={passwordAnalysis().hasSymbols} text="спец. символ" />
          <ListItem checked={passwordAnalysis().hasLength} text="от 8 символов" />
        </div>

        <Input
          invalid={password.invalid() || secondPassword() !== password()}
          value={secondPassword()}
          onInput={setSecondPassword}
          onPaste={e => e.preventDefault()}
          {...secondaryPasswordShowerProps()}
          name="Повторите пароль"
          autocomplete="new-password"
          class="mt-3"
        />

        <Button
          class="mt-4"
          loading={isLoading()}
          disabled={!areFieldsFilled(email, password) || password() !== secondPassword()}
          onClick={async () => {
            setLoading(true)
            const res = await tryLogin(email(), password())
            if (res) navigate("/lk")
            else {
              setLoading(false)
              email.invalidate()
              setErrorMessage("Учетная запись с такой почтой уже существует")
            }
          }}>
          Продолжить
        </Button>
        <A href="/lk/login" class="mt-3 text-sm font-semibold text-primary underline">
          Ко входу
        </A>
      </div>
    </MainLayout>
  )
}
