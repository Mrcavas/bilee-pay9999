import { MainLayout } from "~/app"

export default function Error() {
  return (
    <MainLayout noFooter>
      <div class="mt-4 text-center text-md font-semibold sm:text-lg">Произошла ошибка. Повторите попытку позже</div>
    </MainLayout>
  )
}
