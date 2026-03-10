'use client'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import { faQuestion } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from '@/libs/i18n/Link'
import { useState, useRef, MouseEvent } from 'react'
import { toast } from 'react-toastify'
import ReCAPTCHA from 'react-google-recaptcha'

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_CLIENT_KEY || ''

const RegisterPage = () => {
  const { t } = useTranslation()
  const emailRegex = /\S+@\S+\.\S+/
  const passwordRegex = /^.{6,}$/

  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmpassword, setConfirmpassword] = useState<string>('')
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!email) {
      return
    }

    if (!password) {
      return
    }

    if (!confirmpassword) {
      toast.error(t('auth.register.confirm_password_required'))
    }

    if (typeof email !== 'string') {
      return
    }

    if (typeof password !== 'string') {
      return
    }

    if (typeof confirmpassword !== 'string') {
      return
    }

    if (!emailRegex.test(email)) {
      toast.error(t('auth.register.invalid_email'))
      return
    }

    if (!passwordRegex.test(password)) {
      toast.error(t('auth.register.password_too_short'))
      return
    }

    if (password !== confirmpassword) {
      toast.error(t('auth.register.passwords_mismatch'))
      return
    }

    const recaptchaToken = recaptchaRef.current?.getValue() || ''
    if (!recaptchaToken) {
      toast.error(t('auth.register.captcha_required'))
      return
    }

    toast.success(t('auth.register.registering'))

    await axiosInstance
      .post(`/api/auth/register`, {
        email: email,
        password: password,
        recaptchaToken,
      })
      .then((res) => {
        if (res.data.error) {
          toast.error(res.data.error)
        } else {
          toast.success(res.data.message)
        }
      })
      .catch((err) => {
        toast.error(err.response.data.error)
      })
  }

  return (
    <>
      <div className="space-y-3">
        <div>
          <Link
            href="/auth/login"
            type="button"
            className="block w-full py-2.5 bg-primary font-semibold rounded-lg shadow-md text-white"
          >
            <span className="flex items-center justify-center">{t('auth.register.login_link')}</span>
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-sm font-semibold">{t('common.or')}</span>
        </div>
        <div>
          <div className="">
            <label htmlFor="email" className="sr-only">{t('auth.register.email_label')}</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email as string}
              onChange={(e) => setEmail(e.target.value)}
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
              placeholder={t('auth.register.email_placeholder')}
              aria-required="true"
              className={
                'block w-full rounded-lg border-0 py-1.5 shadow-sm ring-1 ring-inset placeholder:text-primary sm:text-sm sm:leading-6 h-12 p-4'
              }
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between"></div>
          <div className="relative">
            <Link
              className="absolute inset-y-0 right-2 pl-3 flex items-center pointer-events-none"
              href="/auth/forgot-password"
            >
              <FontAwesomeIcon
                icon={faQuestion}
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
            </Link>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password as string}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder={t('auth.register.password_placeholder')}
              aria-label={t('auth.register.password_placeholder')}
              aria-required="true"
              className={
                'block w-full rounded-lg border-0 py-1.5 shadow-sm ring-1 ring-inset placeholder:text-primary sm:text-sm sm:leading-6 h-12 p-4'
              }
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between"></div>
          <div className="relative">
            <input
              id="confirm-password"
              name="confirmpassword"
              type="password"
              required
              value={confirmpassword as string}
              onChange={(e) => setConfirmpassword(e.target.value)}
              autoComplete="new-password"
              placeholder={t('auth.register.confirm_password_placeholder')}
              aria-label={t('auth.register.confirm_password_placeholder')}
              aria-required="true"
              className={
                'block w-full rounded-lg border-0 py-1.5 shadow-sm ring-1 ring-inset placeholder:text-primary sm:text-sm sm:leading-6 h-12 p-4'
              }
            />
          </div>
        </div>

        {recaptchaSiteKey && (
          <div className="flex justify-center">
            <ReCAPTCHA ref={recaptchaRef} sitekey={recaptchaSiteKey} />
          </div>
        )}

        <div>
          <button
            type="submit"
            onClick={handleSubmit}
            className="block w-full py-2.5 bg-primary font-semibold rounded-lg shadow-md text-white"
          >
            {t('auth.register.create_account')}
          </button>
        </div>
      </div>
    </>
  )
}

RegisterPage.layout = 'auth'

export default RegisterPage
