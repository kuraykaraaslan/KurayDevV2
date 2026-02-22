'use client'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect'
import FormHeader from '@/components/admin/UI/Forms/FormHeader'
import DynamicText from '@/components/admin/UI/Forms/DynamicText'
import Form from '@/components/admin/UI/Forms/Form'
import { UserRole, UserStatus } from '@/types/user/UserTypes'

const SingleUser = () => {
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
          toast.error('User not found')
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
        toast.error(error?.response?.data?.message ?? 'Failed to load user')
      } 
    }

    load()
    return () => {
      cancelled = true
    }
  }, [routeUserId])

  const handleSubmit = async () => {
    const errors: string[] = []

    if (!name.trim()) errors.push('Name is required')
    if (!email.trim()) errors.push('Email is required')
    if (mode === 'create' && !password.trim()) errors.push('Password is required')

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
        toast.success('User created successfully')
      } else {
        await axiosInstance.put(`/api/users/${routeUserId}`, { userId: routeUserId, ...body })
        toast.success('User updated successfully')
      }
      router.push('/admin/users')
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Save failed')
    }
  }

  return (
    <Form
      className="mx-auto mb-8 bg-base-300 p-6 rounded-lg shadow max-w-7xl"
      actions={[
        {
          label: 'Save',
          onClick: handleSubmit,
          className: 'btn-primary',
        },
        {
          label: 'Cancel',
          onClick: () => router.push('/admin/users'),
          className: 'btn-secondary',
        },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? 'Create User' : 'Edit User'}
        className="my-4"
        actionButtons={[
          {
            text: 'Back to Users',
            className: 'btn-sm btn-primary',
            onClick: () => router.push('/admin/users'),
          },
        ]}
      />

      <DynamicText label="Name" placeholder="Name" value={name} setValue={setName} size="md" />

      <DynamicText
        label="Email"
        placeholder="Email"
        value={email}
        setValue={setEmail}
        size="md"
      />

      <DynamicText
        label="Phone"
        placeholder="Phone (optional)"
        value={phone}
        setValue={setPhone}
        size="md"
      />

      <DynamicText
        label={mode === 'create' ? 'Password' : 'Password (leave empty to keep current)'}
        placeholder="Password"
        value={password}
        setValue={setPassword}
        size="md"
      />

      <DynamicSelect
        label="Role"
        selectedValue={userRole}
        onValueChange={(value) => setUserRole(value as UserRole)}
        options={[
          { value: 'USER', label: 'User' },
          { value: 'ADMIN', label: 'Admin' },
        ]}
      />

      <DynamicSelect
        label="Status"
        selectedValue={userStatus}
        onValueChange={(value) => setUserStatus(value as UserStatus)}
        options={[
          { value: 'ACTIVE', label: 'Active' },
          { value: 'INACTIVE', label: 'Inactive' },
          { value: 'BANNED', label: 'Banned' },
        ]}
      />
      
    </Form>
  )
}

export default SingleUser
