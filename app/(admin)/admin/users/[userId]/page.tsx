'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import Form from '@/components/admin/UI/Forms/Form'
import { UserRole, UserStatus } from '@/types/user/UserTypes'

const SingleUser = () => {
  const { t } = useTranslation()
  const params = useParams<{ userId: string }>()
  const routeUserId = params?.userId
  const router = useRouter()

  const mode: 'create' | 'edit' = useMemo(
    () => (routeUserId === 'create' ? 'create' : 'edit'),
    [routeUserId]
  )

  // Model fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [userRole, setUserRole] = useState<UserRole>('USER')
  const [userStatus, setUserStatus] = useState<UserStatus>('ACTIVE')
  const [image, setImage] = useState('')

  // Load user (in edit mode)
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!routeUserId) {
        return
      }
      if (routeUserId === 'create') {
        return
      }

      try {
        const res = await axiosInstance.get(`/api/users/${routeUserId}`)
        const user = res.data?.user

        if (!user) {
          toast.error(t('admin.users_form.not_found'))
          return
        }
        if (cancelled) return

        setName(user.userProfile?.name ?? user.name ?? '')
        setEmail(user.email ?? '')
        setPhone(user.phone ?? '')
        setUserRole((user.userRole as UserRole) ?? 'USER')
        setUserStatus((user.userStatus as UserStatus) ?? 'ACTIVE')
        setImage(user.userProfile?.image ?? user.image ?? '')
      } catch (error: any) {
        console.error(error)
        toast.error(error?.response?.data?.message ?? t('admin.users_form.load_failed'))
      } 
    }

    load()
    return () => {
      cancelled = true
    }
  }, [routeUserId])

  const handleSubmit = async () => {
    const errors: string[] = []

    if (!name.trim()) errors.push(t('admin.users_form.name_required'))
    if (!email.trim()) errors.push(t('admin.users_form.email_required'))
    if (mode === 'create' && !password.trim()) errors.push(t('admin.users_form.password_required'))

    if (errors.length) {
      errors.forEach((msg) => toast.error(msg))
      return
    }

    const body: Record<string, any> = {
      name,
      email,
      phone: phone || undefined,
      userRole,
      image: image || undefined,
    }

    if (mode === 'create') {
      body.password = password
    } else if (password.trim()) {
      body.password = password
    }

    try {
      if (mode === 'create') {
        await axiosInstance.post('/api/users', body)
        toast.success(t('admin.users_form.created_success'))
      } else {
        await axiosInstance.put(`/api/users/${routeUserId}`, { userId: routeUserId, ...body })
        toast.success(t('admin.users_form.updated_success'))
      }
      router.push('/admin/users')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? t('admin.users_form.save_failed'))
    }
  }

  return (
    <Form
      className="mx-auto mb-8 bg-base-300 p-6 rounded-lg shadow max-w-7xl"
      actions={[
        {
          label: t('common.save'),
          onClick: handleSubmit,
          className: 'btn-primary',
        },
        {
          label: t('common.cancel'),
          onClick: () => router.push('/admin/users'),
          className: 'btn-secondary',
        },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? t('admin.users_form.create_title') : t('admin.users_form.edit_title')}
        className="my-4"
        actionButtons={[
          {
            text: t('admin.users_form.back'),
            className: 'btn-sm btn-primary',
            onClick: () => router.push('/admin/users'),
          },
        ]}
      />

      <DynamicText label={t('admin.users_form.name_label')} placeholder={t('admin.users_form.name_label')} value={name} setValue={setName} size="md" />

      <DynamicText
        label={t('admin.users_form.email_label')}
        placeholder={t('admin.users_form.email_label')}
        value={email}
        setValue={setEmail}
        size="md"
      />

      <DynamicText
        label={t('admin.users_form.phone_label')}
        placeholder={t('admin.users_form.phone_optional')}
        value={phone}
        setValue={setPhone}
        size="md"
      />

      <DynamicText
        label={mode === 'create' ? t('admin.users_form.password_label') : t('admin.users_form.password_keep_empty')}
        placeholder={t('admin.users_form.password_label')}
        value={password}
        setValue={setPassword}
        size="md"
      />

      <DynamicSelect
        label={t('admin.users_form.role_label')}
        selectedValue={userRole}
        onValueChange={(value) => setUserRole(value as UserRole)}
        options={[
          { value: 'USER', label: t('admin.users_form.role_user') },
          { value: 'AUTHOR', label: t('admin.users_form.role_author') },
          { value: 'ADMIN', label: t('admin.users_form.role_admin') },
        ]}
      />

      <DynamicSelect
        label={t('admin.users_form.status_label')}
        selectedValue={userStatus}
        onValueChange={(value) => setUserStatus(value as UserStatus)}
        options={[
          { value: 'ACTIVE', label: t('admin.users_form.status_active') },
          { value: 'INACTIVE', label: t('admin.users_form.status_inactive') },
          { value: 'BANNED', label: t('admin.users_form.status_banned') },
        ]}
      />
      
    </Form>
  )
}

export default SingleUser
