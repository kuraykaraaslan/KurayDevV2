'use client'
import HeadlessModal, { useModal } from '@/components/common/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEarthAmericas } from '@fortawesome/free-solid-svg-icons'
import dynamic from 'next/dynamic'
import LoadingElement from '@/components/frontend/UI/Content/LoadingElement'
import { useTranslation } from 'react-i18next'

const GeoHeatmap = dynamic(() => import('./content'), {
  ssr: false,
  loading: () => <LoadingElement title="Visitor Map" />,
})

export default function GeoHeatmapButton() {
  const { open, openModal, closeModal } = useModal()
  const { t } = useTranslation()

  return (
    <>
      <button
        onClick={openModal}
        aria-label={t('shared.geomap.open_map')}
        className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
      >
        <FontAwesomeIcon icon={faEarthAmericas} className="text-base" />
        <span className="text-sm hidden md:inline">{t('shared.geomap.open_map')}</span>
      </button>

      <HeadlessModal
        open={open}
        onClose={closeModal}
        title={t('shared.geomap.title')}
        size="xl"
        className="!max-w-4xl"
      >
        <GeoHeatmap />
      </HeadlessModal>
    </>
  )
}
