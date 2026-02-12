'use client'
import { MouseEvent, useEffect, useState } from 'react'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'
import { useSearchParams } from 'next/navigation'

const ForgotPasswordPage = () => {
  const searchParams = useSearchParams()

  const emailRegex = /\S+@\S+\.\S+/

  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    //resetToken and email are passed as query params
    const resetToken = searchParams.get('resetToken')
    const email = searchParams.get('email')

    if (!resetToken || !email) {
      return
    }

    setResetToken(resetToken)
    setEmail(email)

    //set step to 2 if resetToken is present
    setStep(2)
  }, [searchParams])

  const [step, setStep] = useState(1)

  async function handleSubmit(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault()

    if (step === 1) {
      if (!email || emailRegex.test(email) === false) {
        toast.error('Email is required.')
        return
      }

      await axiosInstance
        .post(`/api/auth/forgot-password`, {
          email: email,
        })
        .then(async (res) => {
          if (res.data.error) {
            console.error(res.data.error)
            return
          }
          toast.success('Verification code sent to your email.')
          setStep(2)
        })
        .catch((error) => {
          toast.error(error.response.data.error)
        })

      setStep(2)
    } else {
      // Reset password
      if (password !== confirmPassword) {
        console.error('Passwords do not match')
        return
      }

      await axiosInstance
        .post(`/api/auth/reset-password`, {
          email: email,
          resetToken: resetToken,
          password: password,
        })
        .then(async (res) => {
          if (res.data.error) {
            console.error(res.data.error)
            return
          }
          toast.success('Password reset successfully.')
        })
        .catch((error) => {
          toast.error(error.response.data.error)
        })
      console.log('Resetting password for token:', resetToken)
    }
  }

  return (
    <>
      {step === 1 ? (
        <>
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-primary focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 p-4"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="block w-full py-2.5 bg-primary font-semibold rounded-lg shadow-md text-white"
                onClick={handleSubmit}
              >
                Send Verification Code
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium leading-6">
              Verification Code
            </label>
            <div className="mt-2">
              <input
                id="verificationCode"
                name="verificationCode"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                type="text"
                required
                autoComplete="verificationCode"
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-primary focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 p-4"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6">
              New Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 p-4"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6">
              Confirm Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 p-4"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="block w-full py-2.5 bg-primary font-semibold rounded-lg shadow-md text-white"
              onClick={handleSubmit}
            >
              Reset Password
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ForgotPasswordPage
