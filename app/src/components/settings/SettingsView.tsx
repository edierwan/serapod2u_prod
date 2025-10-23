'use client'

import { useState, useEffect, useRef } from 'react'
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs as TabsComponent, TabsList as TabsList2, TabsTrigger as TabsTrigger2, TabsContent as TabsContent2 } from '@/components/ui/tabs'
import DangerZoneTab from './DangerZoneTab'
import NotificationTypesTab from './NotificationTypesTab'
import NotificationProvidersTab from './NotificationProvidersTab'
import { 
  Settings,
  User,
  Shield,
  Building2,
  Bell,
  Database,
  Mail,
  Palette,
  Globe,
  Save,
  Eye,
  EyeOff,
  Key,
  Phone,
  MapPin,
  Edit,
  FileText,
  AlertTriangle,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  role_code: string
  organization_id: string
  is_active: boolean
  organizations: {
    id: string
    org_name: string
    org_type_code: string
    org_code: string
  }
  roles: {
    role_name: string
    role_level: number
  }
}

interface SettingsViewProps {
  userProfile: UserProfile
}

interface UserSettings {
  full_name: string
  phone_number: string
  timezone: string
  language: string
  email_notifications: boolean
  sms_notifications: boolean
  theme: string
}

interface OrganizationSettings {
  org_name: string
  org_name_short: string
  contact_name: string
  contact_phone: string
  contact_email: string
  address: string
  address_line2: string
  city: string
  state_id: string | null
  district_id: string | null
  postal_code: string
  country_code: string
  require_payment_proof: boolean
  logo_url: string | null
}

export default function SettingsView({ userProfile }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { theme, setTheme } = useTheme()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userSettings, setUserSettings] = useState<UserSettings>({
    full_name: '',
    phone_number: '',
    timezone: 'Asia/Kuala_Lumpur',
    language: 'en',
    email_notifications: true,
    sms_notifications: false,
    theme: 'light'
  })
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    org_name: '',
    org_name_short: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    address_line2: '',
    city: '',
    state_id: null,
    district_id: null,
    postal_code: '',
    country_code: 'MY',
    require_payment_proof: true,
    logo_url: null
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const { isReady, supabase } = useSupabaseAuth()

  useEffect(() => {
    if (isReady) {
      loadSettings()
    }
    // Sync theme from context
    setUserSettings(prev => ({ ...prev, theme }))
  }, [isReady, theme])

  const loadSettings = async () => {
    if (!isReady) return

    try {
      setLoading(true)
      
      // Load user profile data (mock for now)
      setUserSettings({
        full_name: 'John Doe',
        phone_number: '+60123456789',
        timezone: 'Asia/Kuala_Lumpur',
        language: 'en',
        email_notifications: true,
        sms_notifications: false,
        theme: 'light'
      })

      // Load organization data from database
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userProfile.organizations.id)
        .single() as { data: any; error: any }

      if (orgError) throw orgError

      setOrgSettings({
        org_name: orgData.org_name || '',
        org_name_short: orgData.org_code || userProfile.organizations.org_code,
        contact_name: orgData.contact_name || '',
        contact_phone: orgData.contact_phone || '',
        contact_email: orgData.contact_email || '',
        address: orgData.address || '',
        address_line2: orgData.address_line2 || '',
        city: orgData.city || '',
        state_id: orgData.state_id || null,
        district_id: orgData.district_id || null,
        postal_code: orgData.postal_code || '',
        country_code: orgData.country_code || 'MY',
        require_payment_proof: orgData.settings?.require_payment_proof ?? true,
        logo_url: orgData.logo_url || null
      })
      
      // Set initial logo preview
      setLogoPreview(orgData.logo_url || null)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      // In real implementation, this would update the user profile
      console.log('Saving profile settings:', userSettings)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Profile settings saved successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setLoading(true)
      
      // Save user notification settings (profile)
      console.log('Saving notification settings:', userSettings)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Save organization payment proof setting if HQ user
      if (userProfile.organizations.org_type_code === 'HQ' && userProfile.roles.role_level <= 20 && isReady) {
        const { error } = await (supabase as any)
          .from('organizations')
          .update({
            settings: {
              require_payment_proof: orgSettings.require_payment_proof
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', userProfile.organizations.id)

        if (error) throw error
      }

      alert('Notification preferences saved successfully!')
    } catch (error: any) {
      console.error('Error saving notifications:', error)
      alert(`Error saving preferences: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveOrganization = async () => {
    if (!isReady) return

    try {
      setLoading(true)
      
      let logoUrl = orgSettings.logo_url

      // Handle logo upload if there's a new file
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `org-${userProfile.organizations.id}-${Date.now()}.${fileExt}`
        
        // Upload the logo to avatars bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path)

        // Add cache-busting parameter
        logoUrl = `${publicUrl}?v=${Date.now()}`
      }

      // Update the organizations table with new settings including logo
      const { error } = await (supabase as any)
        .from('organizations')
        .update({
          org_name: orgSettings.org_name,
          contact_name: orgSettings.contact_name || null,
          contact_phone: orgSettings.contact_phone || null,
          contact_email: orgSettings.contact_email || null,
          address: orgSettings.address || null,
          address_line2: orgSettings.address_line2 || null,
          city: orgSettings.city || null,
          state_id: orgSettings.state_id || null,
          district_id: orgSettings.district_id || null,
          postal_code: orgSettings.postal_code || null,
          country_code: orgSettings.country_code || null,
          logo_url: logoUrl,
          settings: {
            require_payment_proof: orgSettings.require_payment_proof
          },
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.organizations.id)

      if (error) throw error

      // Clear the logo file selection
      setLogoFile(null)
      
      // Reload organization data to ensure we have the latest logo_url from database
      // This also ensures the cache-busted URL is properly set
      await loadSettings()

      alert('Organization settings saved successfully!')
    } catch (error: any) {
      console.error('Error saving organization:', error)
      alert(`Error saving organization: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      setLoading(true)
      // In real implementation, this would change the password
      console.log('Changing password')
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Error changing password')
    } finally {
      setLoading(false)
    }
  }

  // Handle logo file selection
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setLogoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setOrgSettings(prev => ({ ...prev, logo_url: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Get organization initials for fallback
  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    ...(userProfile.roles.role_level === 1 ? [{ id: 'danger-zone', label: 'Danger Zone', icon: AlertTriangle }] : [])
  ]

  // Check if user can edit organization (Super Admin: 1, HQ Admin: 10, Power User: 20)
  const canEditOrganization = userProfile.roles.role_level <= 20

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Manage your account and system preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={userSettings.full_name}
                    onChange={(e) => setUserSettings({...userSettings, full_name: e.target.value})}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userProfile.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed here</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={userSettings.phone_number}
                    onChange={(e) => setUserSettings({...userSettings, phone_number: e.target.value})}
                    placeholder="+60123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={userProfile.roles.role_name}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organization Settings */}
        {activeTab === 'organization' && (
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                {canEditOrganization 
                  ? 'Update your organization details and contact information'
                  : 'View your organization information (read-only)'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Section */}
              {canEditOrganization && (
                <div className="pb-6 border-b border-gray-200">
                  <Label className="text-base font-semibold mb-4 block">Organization Logo</Label>
                  <div className="flex items-start gap-6">
                    {/* Logo Preview */}
                    <div className="flex-shrink-0">
                      <Avatar className="w-24 h-24 rounded-lg" key={logoPreview || 'no-logo'}>
                        <AvatarImage
                          src={logoPreview || undefined}
                          alt={`${orgSettings.org_name} logo`}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-100 to-blue-50">
                          <Building2 className="w-10 h-10 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        </Button>
                        {logoPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLogo}
                            disabled={loading}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p className="flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          Recommended: Square image, at least 200x200px
                        </p>
                        <p>Supported formats: JPG, PNG, GIF (Max 5MB)</p>
                        {logoFile && (
                          <p className="text-blue-600 font-medium">
                            New logo selected: {logoFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgSettings.org_name}
                    onChange={(e) => setOrgSettings({...orgSettings, org_name: e.target.value})}
                    disabled={!canEditOrganization}
                    className={!canEditOrganization ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgCode">Organization Code</Label>
                  <Input
                    id="orgCode"
                    value={orgSettings.org_name_short}
                    onChange={(e) => setOrgSettings({...orgSettings, org_name_short: e.target.value})}
                    disabled={!canEditOrganization}
                    className={!canEditOrganization ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Name</Label>
                  <Input
                    id="contactPerson"
                    value={orgSettings.contact_name}
                    onChange={(e) => setOrgSettings({...orgSettings, contact_name: e.target.value})}
                    disabled={!canEditOrganization}
                    placeholder="Enter contact person name"
                    className={!canEditOrganization ? 'bg-gray-50 placeholder:text-gray-300' : 'placeholder:text-gray-300'}
                  />
                  {!orgSettings.contact_name && canEditOrganization && (
                    <p className="text-xs text-gray-400 italic">Please enter the contact person&apos;s name</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgPhone">Phone</Label>
                  <Input
                    id="orgPhone"
                    value={orgSettings.contact_phone}
                    onChange={(e) => setOrgSettings({...orgSettings, contact_phone: e.target.value})}
                    disabled={!canEditOrganization}
                    placeholder="Enter phone number (e.g., +60123456789)"
                    className={!canEditOrganization ? 'bg-gray-50 placeholder:text-gray-300' : 'placeholder:text-gray-300'}
                  />
                  {!orgSettings.contact_phone && canEditOrganization && (
                    <p className="text-xs text-gray-400 italic">Please enter the contact phone number</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="orgEmail">Email</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    value={orgSettings.contact_email}
                    onChange={(e) => setOrgSettings({...orgSettings, contact_email: e.target.value})}
                    disabled={!canEditOrganization}
                    placeholder="Enter email address"
                    className={!canEditOrganization ? 'bg-gray-50 placeholder:text-gray-300' : 'placeholder:text-gray-300'}
                  />
                  {!orgSettings.contact_email && canEditOrganization && (
                    <p className="text-xs text-gray-400 italic">Please enter the contact email address</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={orgSettings.address}
                    onChange={(e) => setOrgSettings({...orgSettings, address: e.target.value})}
                    disabled={!canEditOrganization}
                    placeholder="Enter street address"
                    className={!canEditOrganization ? 'bg-gray-50 placeholder:text-gray-300' : 'placeholder:text-gray-300'}
                  />
                  {!orgSettings.address && canEditOrganization && (
                    <p className="text-xs text-gray-400 italic">Please enter the street address</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address_line2"
                    value={orgSettings.address_line2}
                    onChange={(e) => setOrgSettings({...orgSettings, address_line2: e.target.value})}
                    disabled={!canEditOrganization}
                    placeholder="Apt, suite, unit, building, floor, etc."
                    className={!canEditOrganization ? 'bg-gray-50 placeholder:text-gray-300' : 'placeholder:text-gray-300'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={orgSettings.city}
                    onChange={(e) => setOrgSettings({...orgSettings, city: e.target.value})}
                    disabled={!canEditOrganization}
                    placeholder="Enter city"
                    className={!canEditOrganization ? 'bg-gray-50 placeholder:text-gray-300' : 'placeholder:text-gray-300'}
                  />
                  {!orgSettings.city && canEditOrganization && (
                    <p className="text-xs text-gray-400 italic">Enter city name</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state_id">State</Label>
                  <Input
                    id="state_id"
                    value={orgSettings.state_id || ''}
                    disabled={true}
                    placeholder="State (managed in Organizations)"
                    className="bg-gray-50 placeholder:text-gray-300"
                  />
                  <p className="text-xs text-gray-400 italic">State must be managed through Organizations page</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={orgSettings.postal_code}
                    onChange={(e) => setOrgSettings({...orgSettings, postal_code: e.target.value})}
                    disabled={!canEditOrganization}
                    placeholder="Enter postal code"
                    className={!canEditOrganization ? 'bg-gray-50 placeholder:text-gray-300' : 'placeholder:text-gray-300'}
                  />
                  {!orgSettings.postal_code && canEditOrganization && (
                    <p className="text-xs text-gray-400 italic">Enter postal code</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country Code</Label>
                  <Input
                    id="country"
                    value={orgSettings.country_code}
                    onChange={(e) => setOrgSettings({...orgSettings, country_code: e.target.value})}
                    disabled={!canEditOrganization}
                    placeholder="Enter country code (e.g., MY, US, SG)"
                    className={!canEditOrganization ? 'bg-gray-50 placeholder:text-gray-300' : 'placeholder:text-gray-300'}
                  />
                  {!orgSettings.country_code && canEditOrganization && (
                    <p className="text-xs text-gray-400 italic">e.g., MY (Malaysia), US (United States), SG (Singapore)</p>
                  )}
                </div>
              </div>

              {canEditOrganization && (
                <div className="flex justify-end">
                  <Button onClick={handleSaveOrganization} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} disabled={loading}>
                    <Key className="w-4 h-4 mr-2" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* For HQ Power Users - Show comprehensive notification system */}
            {userProfile.organizations.org_type_code === 'HQ' && userProfile.roles.role_level <= 20 ? (
              <TabsComponent defaultValue="types" className="w-full">
                <TabsList2 className="grid w-full grid-cols-2">
                  <TabsTrigger2 value="types">Notification Types</TabsTrigger2>
                  <TabsTrigger2 value="providers">Providers</TabsTrigger2>
                </TabsList2>
                
                <TabsContent2 value="types" className="mt-6">
                  <NotificationTypesTab userProfile={userProfile} />
                </TabsContent2>
                
                <TabsContent2 value="providers" className="mt-6">
                  <NotificationProvidersTab userProfile={userProfile} />
                </TabsContent2>
              </TabsComponent>
            ) : (
              /* Regular Users - Show simple notification preferences */
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about important updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-600" />
                          <Label className="text-base font-medium">Email Notifications</Label>
                        </div>
                        <p className="text-sm text-gray-500">
                          Receive notifications via email for important updates
                        </p>
                      </div>
                      <Switch
                        checked={userSettings.email_notifications}
                        onCheckedChange={(checked) => setUserSettings({
                          ...userSettings, 
                          email_notifications: checked
                        })}
                      />
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-600" />
                          <Label className="text-base font-medium">SMS Notifications</Label>
                        </div>
                        <p className="text-sm text-gray-500">
                          Receive urgent notifications via SMS
                        </p>
                      </div>
                      <Switch
                        checked={userSettings.sms_notifications}
                        onCheckedChange={(checked) => setUserSettings({
                          ...userSettings, 
                          sms_notifications: checked
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveNotifications} disabled={loading}>
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Preferences Settings */}
        {activeTab === 'preferences' && (
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>
                Customize your system experience and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={userSettings.timezone} 
                    onValueChange={(value) => setUserSettings({...userSettings, timezone: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (GMT+8)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (GMT+8)</SelectItem>
                      <SelectItem value="Asia/Jakarta">Asia/Jakarta (GMT+7)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={userSettings.language} 
                    onValueChange={(value) => setUserSettings({...userSettings, language: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select 
                    value={theme} 
                    onValueChange={(value) => {
                      setTheme(value as 'light' | 'dark' | 'system')
                      setUserSettings({...userSettings, theme: value})
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone Tab - Super Admin Only */}
        {activeTab === 'danger-zone' && (
          <DangerZoneTab userProfile={userProfile} />
        )}
      </div>
    </div>
  )
}