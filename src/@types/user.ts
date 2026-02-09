export interface UserCompanySubscription {
  id: string
  ownerId: string
  avatar?: string
  name: string
  status: number | string
  licensed?: boolean
  crmAccess?: boolean
  role?: {
    id?: string
    name?: string
  }
}

export interface CompanySummary {
  id: string
  name: string
  avatar?: string
  phone?: string
  email?: string
}

export interface User {
  id: string
  name: string // Mapeado de fullName
  fullName?: string // Campo original da API
  firstAndSecondName?: string // Campo alternativo da API
  email: string
  document?: string
  phone?: string
  avatar?: string
  username?: string
  birthday?: string
  logo?: string
  logoIsFromCompany?: boolean
  theme?: string
  company?: CompanySummary
  city?: {
    id: string
    name?: string
  }
  state?: {
    id: string
    name?: string
    abbreviation?: string
  }
  subscribedOnCompanies?: UserCompanySubscription[]
  accounts?: Array<{ provider: string }>
  useCompanyProfile?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
  isSignUpCompleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AuthenticatedUser extends User {
  roles?: string[]
  permissions?: string[]
}
