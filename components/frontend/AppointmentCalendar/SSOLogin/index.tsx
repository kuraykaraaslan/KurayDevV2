'use client'
import React from 'react'
import axiosInstance from '@/libs/axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faApple,
  faGithub,
  faGoogle,
  faMicrosoft
} from '@fortawesome/free-brands-svg-icons'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

const SSOLogin: React.FC = () => {
  const router = useRouter()

  const handleGoogleLogin = async () => {
    axiosInstance
      .get('/api/auth/sso/google')
      .then(response => {
        const url = response.data.url
        router?.push(url)
      })
      .catch(error => {
        console.log(error)
      })
  }

  const handleAppleLogin = () => {
    axiosInstance
      .get('/api/auth/sso/apple')
      .then(response => {
        const url = response.data.url
        router?.push(url)
      })
      .catch(error => {
        console.log(error)
      })
  }

  const handleGithubLogin = () => {
    //disabled for now
    toast.error('Github login is disabled for now')
    return

    axiosInstance
      .get('/api/auth/sso/github')
      .then(response => {
        const url = response.data.url
        router?.push(url)
      })
      .catch(error => {
        console.log(error)
      })
  }

  const handleMicrosoftLogin = () => {
    //disabled for now
    toast.error('Microsoft login is disabled for now')
    return

    axiosInstance
      .get('/api/auth/sso/microsoft')
      .then(response => {
        const url = response.data.url
        router?.push(url)
      })
      .catch(error => {
        console.log(error)
      })
  }

  return (
    <>
      <div className='flex flex-row items-center justify-center mb-8 mt-2'>
        <div className='flex-1 text-sm font-semibold leading-6'>
          <span className='select-none'>
            you need to login with one of the following:
          </span>
        </div>
        <div className='flex flex-row space-x-2 flex-wrap justify-center'>
          <button
            type='button'
            className='btn text-sm text-white font-semibold leading-6 bg-[#405de6] rounded-lg'
            onClick={handleGoogleLogin}
          >
            <FontAwesomeIcon
              icon={faGoogle}
              className='h-4 w-4'
              aria-hidden='true'
            />
          </button>
          <button
            type='button'
            className='btn text-sm text-white font-semibold leading-6 bg-[#000000] rounded-lg'
            onClick={handleAppleLogin}
          >
            <FontAwesomeIcon
              icon={faApple}
              className='h-4 w-4'
              aria-hidden='true'
            />
          </button>
          <button
            type='button'
            className='btn text-sm text-white font-semibold leading-6 bg-[#333] rounded-lg'
            onClick={handleGithubLogin}
          >
            <FontAwesomeIcon
              icon={faGithub}
              className='h-4 w-4'
              aria-hidden='true'
            />
          </button>

          <button
            type='button'
            className='btn text-sm text-white font-semibold leading-6 bg-[#00acee] rounded-lg'
            onClick={handleMicrosoftLogin}
          >
            <FontAwesomeIcon
              icon={faMicrosoft}
              className='h-4 w-4'
              aria-hidden='true'
            />
          </button>
        </div>
      </div>
      <div className='text-sm text-primary mb-4 select-none'>
        <p className="text-xs text-base-content">for verification purposes, only registered users can book appointments. If you are not registered, you can still book an appointment by using the contact form.</p>
      </div>
    </>
  )
}

export default SSOLogin
