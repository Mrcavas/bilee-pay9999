type PaymentMethod = {
  id: number
  name: string
  // icon_id: number
  icon: Icon
  min_amount: number
  max_amount: number
  commission: number
  min_commission_amount: number
  // payment_system_id: number
  position_index: number
  // project_id: number
  // deleted: boolean
  // enabled: boolean
  primary: boolean
}

type Icon = {
  id: number
  url: string
  name: string
}
