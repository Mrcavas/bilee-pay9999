import { useLocation } from "@solidjs/router"
import { JSX, Show } from "solid-js"
import { twMerge } from "tailwind-merge"

export default function LegalFooter(props: Pick<JSX.IntrinsicElements["div"], "class">) {
  const location = useLocation()

  return (
    <Show when={location.pathname === "/"}>
      <div class={twMerge("flex flex-col gap-5 text-sm text-hint2", props.class)}>
        <div class="text-base font-semibold text-text">© Test Bot, 2024</div>

        <div>
          Все права принадлежат их правообладателям.
          <br />
          All rights belong to their copyright holders.
        </div>

        <div class="flex flex-wrap justify-between gap-1.5 max-sm:flex-col">
          <a href="https://example.com/" class="underline">
            Поддержка
          </a>
          <a href="https://example.com/" class="underline">
            Пользовательское соглашение
          </a>
          <a href="https://example.com/" class="underline">
            Политика конфиденциальности
          </a>
        </div>
      </div>
    </Show>
  )
}
