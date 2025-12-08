'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import i18n from "@/libs/localize/localize";

enum Status {
    operational = 'operational',
    degraded_performance = 'degraded_performance',
    partial_outage = 'partial_outage',
    major_outage = 'major_outage',
    unknown = 'unknown'
}

export default function SystemStatusModalContent() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const { t } = i18n;

    const fetchStatus = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await axios.get('/api/status')
            setData(normalizeStatuses(res.data))
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

    return (
        <div className="space-y-3 text-sm">

            {loading && <div className="text-center py-4 opacity-70">{t("status.loading")}</div>}
            {error && <div className="text-error text-center py-4">{error}</div>}

            {!loading && data && (
                <>
                    {Object.entries(data.services || {}).map(([key, value]: any) => (
                        <div key={key} className="flex justify-between items-center">
                            <span className="capitalize">{t("status.service_names." + key)}</span>
                            <span className={`flex items-center gap-1 ${getColor(value.status)}`}>
                                <FontAwesomeIcon icon={faCircle} className="text-[8px]" />
                                {t("status.statuses." + value.status)}
                            </span>
                        </div>
                    ))}

                    <hr className="border-base-300" />

                    <div className="flex justify-between text-xs opacity-70">
                        <span>
                            {t("status.response_time", { time: data.responseTimeMs })} • {t("status.uptime", { time: Math.floor(data.uptimeSec / 60) })}    
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
    )
}
