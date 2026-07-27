import { useTranslation } from 'react-i18next'

const TerminalCard = () => {
  const { t } = useTranslation()

  return (
    <div className="hidden lg:block w-full max-w-md rounded-none border border-base-300 bg-base-300 shadow-2xl overflow-hidden font-mono text-sm">
      <div className="flex items-center gap-2 border-b border-base-content/10 bg-base-100 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-yellow-500" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
        <span className="ms-2 text-xs opacity-60">availability.sh</span>
      </div>
      <div className="p-6 space-y-2 leading-relaxed">
        <p>
          <span className="text-primary">$</span> whoami
        </p>
        <p className="ps-4 opacity-80">kuray karaaslan — software architect &amp; product engineer</p>

        <p className="pt-3">
          <span className="text-primary">$</span> status --availability
        </p>
        <p className="ps-4 text-success">✓ {t('pages.freelance.hero.availability')}</p>

        <p className="pt-3">
          <span className="text-primary">$</span> stack --domains
        </p>
        <p className="ps-4 opacity-80">saas · iot · bim · real-time</p>

        <p className="flex items-center gap-1 pt-3">
          <span className="text-primary">$</span>
          <span className="inline-block h-4 w-2 animate-pulse bg-base-content" aria-hidden="true" />
        </p>
      </div>
    </div>
  )
}

export default TerminalCard
