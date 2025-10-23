export interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role_code: string
  organization_id: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  avatar_url: string | null
  last_login_at: string | null
}

export interface UserFormData extends Omit<User, 'created_at' | 'updated_at' | 'last_login_at'> {
  password?: string
}

export interface Role {
  role_code: string
  role_name: string
  role_level: number
}

export interface Organization {
  id: string
  org_name: string
  org_code: string
  org_type_code?: string
}
