'use client'
import { useState, useEffect } from 'react'
import axiosInstance from '@/libs/axios'
import { Setting } from '@/types/common/SettingTypes'

const Page = () => {
  const [defaultSettings, _setDefaultSettings] = useState<Pick<Setting, 'key' | 'value'>[]>([
    {
      key: 'ALLOW_REGISTRATION',
      value: 'true',
    },
  ])

  const [settings, setSettings] = useState<Pick<Setting, 'key' | 'value'>[]>([])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    await axiosInstance
      .get('/api/settings')
      .then((res) => {
        const incomingSettings = res.data.settings as Pick<Setting, 'key' | 'value'>[]

        //merge default settings with incoming settings
        const mergedSettings = defaultSettings.map((ds) => {
          const existingSetting = incomingSettings.find((s) => s.key === ds.key)
          return existingSetting ? existingSetting : ds
        })

        //set settings
        setSettings(mergedSettings)
      })
      .catch((error) => {
        console.error(error)
      })
  }

  const updateSettings = async () => {
    await axiosInstance
      .post('/api/settings', { settings })
      .then((res) => {
        setSettings(res.data.settings)
      })
      .catch((error) => {
        console.error(error)
      })
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between md:items-center flex-col md:flex-row">
        <h1 className="text-3xl font-bold h-16 md:items-center">Settings</h1>
        <div className="flex gap-2 h-16 w-full md:w-auto md:flex-none">
          <button className="btn btn-primary btn-sm h-12" onClick={() => updateSettings()}>
            Update Settings
          </button>
        </div>
      </div>

      {settings.length === 0 ? (
        <div className="flex justify-center items-center h-[400px]">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
          <div className="card bordered bg-base-100">
            <div className="card-body">
              <h2 className="card-title">General Settings</h2>
              <div className="form-control flex flex-row items-center">
                <label className="label">
                  <span className="label-text">Allow Registration</span>
                </label>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  onChange={(e) => {
                    const value = e.target.checked ? 'true' : 'false'
                    setSettings(
                      settings.map((s) => (s.key === 'ALLOW_REGISTRATION' ? { ...s, value } : s))
                    )
                  }}
                  checked={settings.find((s) => s.key === 'ALLOW_REGISTRATION')?.value === 'true'}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Page
