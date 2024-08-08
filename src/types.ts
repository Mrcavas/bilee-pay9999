type ApiResponse<T> =
  | ({
      success: true
    } & T)
  | {
      success: false
      error: {
        code: string
        user_message: string
      }
    }

type PaymentMethod = {
  id: number
  name: string
  icon_id?: number
  icon: {
    id: number
    url: string
    name: string
  }
  min_amount: number
  max_amount: number
  commission: number
  min_commission_amount: number
  payment_system_id?: number
  system?: {
    id: number
    name: string
    slug: string
    active: boolean
  }
  position_index: number
  project_id: number
  deleted: boolean
  enabled: boolean
  primary: boolean
  params: ParamData[]
}

type PaymentMethodCreate = {
  name: string
  icon_id: number
  min_amount: number
  max_amount: number
  commission: number
  min_commission_amount: number
  payment_system_id: number
  params: ParamData[]
}

type ParamData = {
  param_id: number
  value: string | number | boolean
}

type Icon = {
  id: number
  url: string
  name: string
}

type Project = {
  id: number
  // status: string
  bot_token: string
  name: string
  picture: string
  link: string
  support_url: string
  notify_url: string
  footer_text: string
  url: string
  max_payment_methods: number
  // created_at: "2024-08-05T13:11:31.541Z"
  // updated_at: "2024-08-05T13:11:31.541Z"
}

interface Window {
  accessToken: string
}

type ApiKey = { name: string; protected_token: string }

type PaymentSystem = {
  id: number
  name: string
  slug: string
  active: boolean
  method_params: MethodParam[]
}

type MethodParam = {
  id: number
  name: string
  key_name: string
  is_optional: boolean
  example: string
} & (
  | {
      type: "string" | "int" | "float" | "boolean"
    }
  | {
      type: "enum"
      enum: string[]
    }
)
