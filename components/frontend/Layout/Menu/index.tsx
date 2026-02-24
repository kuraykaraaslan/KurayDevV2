'use client'
import { useGlobalStore } from '@/libs/zustand'
import { IconDefinition } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MenuItem } from '@/types/ui/UITypes'
import '@/libs/localize/localize'
import { useTranslation } from 'react-i18next'
import useI18nRouter from '@/libs/i18n/useI18nRouter'

const Menu = ({
  isSidebar = false,
  menuItems = [],
  onItemClick,
}: {
  isSidebar?: boolean
  menuItems: MenuItem[]
  onItemClick?: () => void
}) => {
  const router = useI18nRouter()
  const { user } = useGlobalStore()

  const { t } = useTranslation()

  const isAdmin = user?.userRole === 'ADMIN' || user?.userRole === 'SUPER_ADMIN'

  const getYpositionOfElementById = (id: string) => {
    const additionalOffset = 100
    const element = document.getElementById(id)

    if (element) {
      return element.getBoundingClientRect().top + window?.scrollY - additionalOffset
    }
    return null
  }

  const scrollOrRedirect = (item: MenuItem) => {
    if (item.external) {
      window?.open(item.page, '_blank')
      return
    }

    const { id, page } = item
    if (!id) {
      router.push(page)
      return
    }
    const yPosition = getYpositionOfElementById(id)

    if (yPosition === null) {
      router.push(page)
      setTimeout(() => {
        const yPosition = getYpositionOfElementById(id)
        if (yPosition !== null) {
          window?.scrollTo({ top: yPosition, behavior: 'smooth' })
        }
      }, 700)

      return
    }

    window?.scrollTo({ top: yPosition, behavior: 'smooth' })
  }

  return (
    <>
      {menuItems?.map((item) => (
        <li
          key={item.id}
          style={{
            display: item.onlyAdmin && !isAdmin ? 'none' : 'block',

            marginLeft: '1px',
            marginTop: '4px',
          }}
          onClick={() => { scrollOrRedirect(item); onItemClick?.() }}
          className={
            (item.textColour ? item.textColour : 'text-base-content') +
            ' ' +
            (item.backgroundColour ? item.backgroundColour : ' ') +
            ' rounded-md'
          }
        >
          <div className="flex items-center gap-2 h-8">
            {item.icon && (
              <FontAwesomeIcon icon={item.icon as IconDefinition} className="w-6 h-6" />
            )}
            <span
              className={item.hideTextOnDesktop && !isSidebar ? 'hidden' : 'block'}
              suppressHydrationWarning
            >
              {t(`navigation.${item.name}`)}
            </span>
          </div>
        </li>
      ))}
    </>
  )
}

export default Menu
