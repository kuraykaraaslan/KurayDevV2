'use client'
import HeadlessModal, { useModal } from '@/components/common/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMap } from '@fortawesome/free-solid-svg-icons'
import dynamic from 'next/dynamic'
import LoadingElement from '../LoadingElement'
import i18n from "@/libs/localize/localize";

const GeoHeatmap = dynamic(() => import('./content'), { ssr: false, loading: () => <LoadingElement title={i18n.t("GeoHeatmap")} /> })

export default function GeoHeatmapButton() {
  const { open, openModal, closeModal } = useModal()

  return (
    <div className="">
      <button onClick={openModal} className="">
        <FontAwesomeIcon icon={faMap} className="mr-2 text-lg" />
      </button>

      <HeadlessModal
        open={open}
        onClose={closeModal}
        title={i18n.t("geomap.title")}
        size="lg" 
        className="!max-w-5xl" 
      >
        <div className="flex items-center justify-center w-full h-[70vh] bg-base-200 rounded-box">
          <GeoHeatmap />
        </div>
      </HeadlessModal>
    </div>
  )
}
