'use client'
import React, { useMemo, useCallback } from 'react'
import axiosInstance from '@/libs/axios'
import { toast } from 'react-toastify'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faApple,
  faGithub,
  faGoogle,
  faMicrosoft,
  faFacebook,
  faTwitter,
  faTiktok
} from '@fortawesome/free-brands-svg-icons'
import { faPeopleGroup } from '@fortawesome/free-solid-svg-icons'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const AutodeskIcon: IconDefinition = {
  prefix: 'fab',
  //@ts-ignore
  iconName: 'autodesk',
  icon: [
    24,
    24,
    [],
    '',
    'M14.574 1.0203c-0.097-0.096997-0.29099-0.58198-0.97097-0.58198h-6.7038s0.97097 0.096997 1.36 1.068c0 0 1.069 2.5269 2.0399 4.9558 2.8179 6.6068 7.1898 17.099 7.1898 17.099h6.5108c0.097-0.097-9.3267-22.443-9.4247-22.54zm-8.8407 0.87497-5.3438 12.631c-0.29199 0.87497-0.097997 1.9439 1.457 1.9439h4.1779l3.6919-8.8417c-1.166-2.9149-2.1359-5.2478-2.1359-5.2478-0.096997-0.29199-0.38899-1.069-0.97197-1.069-0.58298 0-0.77698 0.48598-0.87397 0.58298zm-0.097997 15.643h-4.4689c-0.77698 0-1.166-0.48598-1.166-0.48598 0.77698 1.36 3.0119 5.6358 3.0119 5.6358 0.38899 0.48598 0.77698 0.77698 1.36 0.77698 1.263 0 3.2069-1.263 3.2069-1.263l7.4808-4.6639z'
  ]
}

const buttonMap: Record<string, { bg: string; hover: string; text: string; icon: IconDefinition }> = {
  google: { bg: 'bg-[#4285F4]', hover: 'hover:bg-[#357AE8]', text: 'text-white', icon: faGoogle },
  apple: { bg: 'bg-black', hover: 'hover:bg-gray-800', text: 'text-white', icon: faApple },
  autodesk: { bg: 'bg-[#FF6A13]', hover: 'hover:bg-[#FF4C00]', text: 'text-white', icon: AutodeskIcon },
  github: { bg: 'bg-[#333]', hover: 'hover:bg-[#222]', text: 'text-white', icon: faGithub },
  microsoft: { bg: 'bg-[#0078D4]', hover: 'hover:bg-[#005A9E]', text: 'text-white', icon: faMicrosoft },
  facebook: { bg: 'bg-[#3b5998]', hover: 'hover:bg-[#2d4373]', text: 'text-white', icon: faFacebook },
  twitter: { bg: 'bg-[#1DA1F2]', hover: 'hover:bg-[#0d95e8]', text: 'text-white', icon: faTwitter },
  tiktok: { bg: 'bg-black', hover: 'hover:bg-gray-900', text: 'text-white', icon: faTiktok }
}

type SSOLoginMode = 'modal' | 'pins' | 'list'

interface SSOLoginProps {
  mode?: SSOLoginMode
}

const SSOLoginContent: React.FC<SSOLoginProps> = ({ mode }) => {

  const allowedProviders = useMemo(() => {
    return (process.env.SSO_ALLOWED_PROVIDERS || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
  }, [])

  const handleLogin = useCallback(
    async (provider: string) => {
      if (!allowedProviders.includes(provider)) {
        toast.error(`SSO login for ${provider} is not allowed.`)
        return
      }
      try {
        const res = await axiosInstance.get(`/api/auth/sso/${provider}`)
        window.location.href = res.data.url
      } catch (e) {
        toast.error('SSO yönlendirme hatası.')
        console.error(e)
      }
    },
    [allowedProviders]
  )

  if (allowedProviders.length === 0) {
    return (
      <div className='text-center text-sm text-gray-500'>
        No SSO providers configured.
      </div>
    )
  }

  const renderButton = (provider: string, circle = false) => {
    const config = buttonMap[provider]
    const classes = `btn ${circle ? 'btn-circle' : 'btn-block'} ${config?.bg} ${config?.hover} ${config?.text} text-sm font-semibold`
    return (
      <button key={provider} className={classes} onClick={() => handleLogin(provider)}>
        <FontAwesomeIcon icon={config?.icon || faPeopleGroup} className='h-4 w-4' />
        {!circle && (
          <span className='ml-2'>
            Login with {provider.charAt(0).toUpperCase() + provider.slice(1)}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={mode === 'list' ? 'flex flex-col space-y-2' : 'flex flex-row flex-wrap space-x-2 justify-center'}>
      {allowedProviders.map(p => renderButton(p, mode !== 'list'))}
    </div>
  )
}

const SSOLogin: React.FC<SSOLoginProps> = ({ mode = 'list' }) => {
  if (mode === 'modal') {
    return (
      <>
        <button
          className='btn btn-primary btn-block text-sm text-white font-semibold leading-6'
          onClick={() => (document?.getElementById('sso_modal') as HTMLDialogElement)?.showModal()}
        >
          <FontAwesomeIcon icon={faPeopleGroup} className='h-4 w-4' />
          <span className='ml-2'>Login with Social Media</span>
        </button>
        <dialog id='sso_modal' className='modal'>
          <div className='modal-box'>
            <h3 className='font-bold text-lg mb-4'>Login with Social Media</h3>
            <SSOLoginContent mode='list' />
            <div className='modal-action'>
              <form method='dialog'>
                <button className='btn'>Close</button>
              </form>
            </div>
          </div>
        </dialog>
      </>
    )
  }

  return <SSOLoginContent mode={mode} />
}

export default SSOLogin
