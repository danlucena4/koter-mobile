export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  cpf: string
  birthday: Date
  phone: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  cpf: string
  birthday: Date
  phone: string
  recaptcha: string
  platform: 'mobile'
}
