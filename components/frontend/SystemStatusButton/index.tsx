'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faServer, faCircle } from '@fortawesome/free-solid-svg-icons'

enum Status {
  operational = 'operational',
  degraded_performance = 'degraded_performance',
  partial_outage = 'partial_outage',
  major_outage = 'major_outage',
  unknown = 'unknown'
}

export default function SystemStatusButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [overallStatus, setOverallStatus] = useState<Status>(Status.unknown)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get('/api/status')
      const normalized = normalizeStatuses(res.data)
      setData(normalized)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const normalizeStatuses = (raw: any) => {
    const mapped = Object.fromEntries(
      Object.entries(raw.services || {}).map(([k, v]: any) => {
        let status: Status = Status.unknown
        switch (v.status) {
          case 'OK':
            status = Status.operational
            break
          case 'FAIL':
            status = Status.major_outage
            break
          default:
            status = Status.unknown
        }
        return [k, { ...v, status }]
      })
    )
    return { ...raw, services: mapped }
  }

  const getColor = (status: Status | string) => {
    switch (status) {
      case Status.operational:
        return 'text-green-500'
      case Status.degraded_performance:
        return 'text-yellow-500'
      case Status.partial_outage:
        return 'text-orange-500'
      case Status.major_outage:
        return 'text-red-500'
      default:
        return 'text-gray-400'
    }
  }

  useEffect(() => {
    if (data && data.services) {
      const statuses = Object.values(data.services).map(
        (s: any) => s.status as Status
      )
      if (statuses.includes(Status.major_outage)) {
        setOverallStatus(Status.major_outage)
      } else if (statuses.includes(Status.partial_outage)) {
        setOverallStatus(Status.partial_outage)
      } else if (statuses.includes(Status.degraded_performance)) {
        setOverallStatus(Status.degraded_performance)
      } else if (statuses.every((s) => s === Status.operational)) {
        setOverallStatus(Status.operational)
      } else {
        setOverallStatus(Status.unknown)
      }
    } else {
      setOverallStatus(Status.unknown)
    }
  }, [data])

  return (
    <>
      {/* 🔘 Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className=""
      >
        <FontAwesomeIcon
          icon={faCircle}
          className={`text-[8px] px-1 ${getColor(overallStatus)}`}
        />
        <span className="text-sm">Status</span>
      </button>

      {/* 🪟 Modal */}
      <dialog id="system-status-modal" className={`modal ${open ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FontAwesomeIcon icon={faServer} />
              System Status
            </h3>
            {data && (
              <span
                className={`badge ${
                  data.cached ? 'badge-warning' : 'badge-success'
                } badge-sm`}
              >
                {data.cached ? 'Cached' : 'Live'}
              </span>
            )}
          </div>

          {/* İçerik */}
          <div className="space-y-1 text-sm">
            {loading && (
              <div className="text-center py-3">
                Checking system status...
              </div>
            )}

            {error && (
              <div className="text-warning text-center py-3">{error}</div>
            )}

            {!loading && data && (
              <>
                {Object.entries(data.services || {}).map(([key, value]: any) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-0.5"
                  >
                    <span className="capitalize">{key}</span>
                    <span
                      className={`flex items-center gap-1 ${getColor(
                        value.status
                      )}`}
                    >
                      <FontAwesomeIcon icon={faCircle} className="text-[8px]" />
                      {value.status}
                    </span>
                  </div>
                ))}

                <hr className="my-2 border-gray-200" />

                <div className="text-xs flex justify-between">
                  <span>
                    {data.responseTimeMs}ms • Uptime:{' '}
                    {Math.floor(data.uptimeSec / 60)}m
                  </span>
                  <span>
                    {new Date(data.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Butonlar */}
          <div className="modal-action">
            <button
              onClick={() => setOpen(false)}
              className="btn btn-sm btn-primary"
            >
              Close
            </button>
          </div>
        </div>

        {/* Backdrop */}
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setOpen(false)}>close</button>
        </form>
      </dialog>
    </>
  )
}
