'use client'
import axiosInstance from '@/libs/axios'
import Link from '@/libs/i18n/Link'
import { MouseEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useUserStore } from '@/libs/zustand'
import { useRouter } from '@/libs/i18n/useI18nRouter'
import { useSearchParams } from 'next/navigation'
import { OTPActionEnum, OTPMethod } from '@/types/user/UserSecurityTypes'
import { SafeUser } from '@/types/user/UserTypes'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'AUTHOR']

function resolveRedirect(redirect: string | null, user: SafeUser | null): string {
  if (!redirect) return '/'
  const isAdminRedirect = redirect.startsWith('/admin')
  if (isAdminRedirect && (!user || !ADMIN_ROLES.includes(user.userRole ?? ''))) return '/'
  return redirect
}
import OTPConfirmModal from '@/components/frontend/Features/Settings/Tabs/OTPTab/partials/OTPConfirmModal'
import PasskeyLoginButton from '@/components/auth/PasskeyLoginButton'
import { useTranslation } from 'react-i18next'

const LoginPage = () => {
  const { t } = useTranslation()
  const emailRegex = /\S+@\S+\.\S+/
  const passwordRegex = /^.{6,}$/

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [rememberDevice, setRememberDevice] = useState<boolean>(false)

  const { user, setUser } = useUserStore()

  const router = useRouter()
  const searchParams = useSearchParams()

  const [availableMethods, setAvailableMethods] = useState<OTPMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<OTPMethod | null>(null)

  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const otpInputRef = useRef<HTMLInputElement>(null)

  // ── Passkey Conditional UI ──────────────────────────────────────────────
  // Starts a resident-key authentication in the background so the browser
  // can show registered passkeys inside the email input's autocomplete list
  // (same UX as Google / GitHub — no extra button needed for enrolled users).
  useEffect(() => {
    if (!window.PublicKeyCredential) return

    let aborted = false
    const controller = new AbortController()

    const startConditional = async () => {
      try {
        const { startAuthentication } = await import('@simplewebauthn/browser')

        const optRes = await fetch('/api/auth/passkey/authenticate/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          credentials: 'include',
          signal: controller.signal,
        })
        if (!optRes.ok || aborted) return

        const { options } = (await optRes.json()) as { options: Record<string, unknown> }

        const assertion = await startAuthentication({
          optionsJSON: options as unknown as Parameters<typeof startAuthentication>[0]['optionsJSON'],
          useBrowserAutofill: true,
        })

        if (aborted) return

        const verifyRes = await fetch('/api/auth/passkey/authenticate/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response: assertion }),
          credentials: 'include',
        })
        if (!verifyRes.ok) return

        const { user } = (await verifyRes.json()) as { user: Parameters<typeof setUser>[0] }
        setUser(user)
        toast.success(t('auth.passkey.auth_success'))
        router.push(resolveRedirect(searchParams.get('redirect'), user))
      } catch {
        // AbortError on unmount or user dismissal — silently ignored
      }
    }

    void startConditional()

    return () => {
      aborted = true
      controller.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!email) {
      return
    }

    if (!password) {
      return
    }

    if (typeof email !== 'string') {
      toast.error(t('auth.login.invalid_email'))
      return
    }

    if (typeof password !== 'string') {
      toast.error(t('auth.login.password_too_short'))
      return
    }

    if (!emailRegex.test(email)) {
      toast.error(t('auth.login.invalid_email'))
      return
    }

    if (!passwordRegex.test(password)) {
      toast.error(t('auth.login.password_requirements'))
      return
    }

    await axiosInstance
      .post(`/api/auth/login`, {
        email,
        password,
        rememberDevice,
      })
      .then(async (res) => {
        const userSecurity = res.data.userSecurity
        const { user } = res.data
        setUser(user)

        if (userSecurity.otpMethods.length > 0) {
          setAvailableMethods(userSecurity.otpMethods)
          setSelectedMethod(userSecurity.otpMethods[0])
          setOtpSent(false)
          setOtpCode('')
          setOtpModalOpen(true)
          return
        }
        toast.success(t('auth.login.success'))
        router.push('/')
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || t('auth.login.failed'))
      })
  }

  const handleMethodChange = (method: OTPMethod) => {
    setSelectedMethod(method)
    setOtpSent(false)
    setOtpCode('')
  }

  const onSentOtp = async () => {
    if (!selectedMethod) return

    try {
      setSendingOtp(true)
      await axiosInstance.post('/api/auth/login/send', {
        method: selectedMethod,
        action: OTPActionEnum.Enum.authenticate,
      })
      setOtpSent(true)
      toast.success(t('auth.login.otp_sent'))
      setTimeout(() => otpInputRef.current?.focus(), 100)
    } catch {
      toast.error(t('auth.login.otp_send_failed'))
    } finally {
      setSendingOtp(false)
    }
  }

  const onVerifyOtp = async () => {
    if (!selectedMethod) return

    try {
      setVerifyingOtp(true)

      await axiosInstance
        .post('/api/auth/login/verify', {
          method: selectedMethod,
          otpToken: otpCode,
          action: OTPActionEnum.Enum.authenticate,
        })
        .then(() => {
          toast.success(t('auth.login.otp_verified'))
          router.push(resolveRedirect(searchParams.get('redirect'), user))
        })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      toast.error(axiosErr?.response?.data?.message || t('auth.login.otp_verify_failed'))
    } finally {
      setVerifyingOtp(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <Link
            href="/auth/register"
            type="button"
            className="block w-full py-2.5 bg-primary font-semibold rounded-lg shadow-md text-white"
          >
            <span className="flex items-center justify-center">{t('auth.login.create_account_link')}</span>
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-sm font-semibold">{t('common.or')}</span>
        </div>
        <div>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username webauthn"
              value={email as string}
              onChange={(e) => setEmail(e.target.value)}
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
              placeholder={t('auth.login.email_placeholder')}
              className={
                'block w-full rounded-lg border-0 py-1.5 shadow-sm ring-1 ring-inset placeholder:text-primary sm:text-sm sm:leading-6 h-12 p-4'
              }
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span />
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('auth.login.forgot_password_link')}
            </Link>
          </div>
          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password as string}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder={t('auth.login.password_placeholder')}
              className={
                'block w-full rounded-lg border-0 py-1.5 shadow-sm ring-1 ring-inset placeholder:text-primary sm:text-sm sm:leading-6 h-12 p-4'
              }
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="remember-device"
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
          />
          <label htmlFor="remember-device" className="text-sm cursor-pointer select-none">
            {t('auth.login.remember_device')}
          </label>
        </div>
        <div>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!email || !password}
            className="block w-full py-2.5 bg-primary font-semibold rounded-lg shadow-md text-white"
          >
            {t('auth.login.sign_in')}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="flex-1 h-px bg-base-300" />
          <span className="text-sm text-base-content/50">{t('common.or')}</span>
          <span className="flex-1 h-px bg-base-300" />
        </div>

        <PasskeyLoginButton
          email={email || undefined}
          onSuccess={(user) => {
            setUser(user)
            toast.success(t('auth.passkey.auth_success'))
            router.push(resolveRedirect(searchParams.get('redirect'), user))
          }}
        />
      </div>

      <OTPConfirmModal
        open={otpModalOpen}
        otpSent={otpSent}
        otpCode={otpCode}
        sendingOtp={sendingOtp}
        verifying={verifyingOtp}
        otpInputRef={otpInputRef as React.RefObject<HTMLInputElement>}
        onSendOtp={onSentOtp}
        onVerify={onVerifyOtp}
        onChangeCode={setOtpCode}
        onClose={() => setOtpModalOpen(false)}
        method={selectedMethod}
        availableMethods={availableMethods}
        onMethodChange={handleMethodChange}
      />
    </>
  )
}

LoginPage.layout = 'auth'

export default LoginPage

