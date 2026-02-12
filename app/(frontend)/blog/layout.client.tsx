'use client'

import { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import useGlobalStore from '@/libs/zustand'
import i18n from '@/libs/localize/localize'

const BlogLayoutClient = () => {
  const { language } = useGlobalStore()
  const [languageNotifiedOnce, setLanguageNotifiedOnce] = useState(false)
  const { t } = i18n

  useEffect(() => {
    if (languageNotifiedOnce) return

    if (language !== 'en') {
      toast.info(t('shared.alert.this_blog_is_available_in_only_english'))
      setLanguageNotifiedOnce(true)
    }
  }, [language, languageNotifiedOnce, t])

  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  )
}

export default BlogLayoutClient
