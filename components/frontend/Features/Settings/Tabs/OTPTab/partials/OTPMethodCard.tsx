import { OTPMethod } from '@/types/user/UserSecurityTypes';
import { useTranslation } from 'react-i18next';

type Props = {
  method: OTPMethod;
  enabled: boolean;
  onClick: () => void;
};

export default function OTPMethodCard({ method, enabled, onClick }: Props) {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition
        ${enabled
          ? 'border-primary bg-primary/10'
          : 'border-base-300 hover:bg-base-200'
        }
      `}
    >
      <div className="flex justify-between items-center">
        <span className="font-semibold">{method}</span>
        <span className={`text-sm ${enabled ? 'text-primary' : 'text-base-content/60'}`}>
          {enabled ? t('frontend.settings.otp_method_card.active') : t('frontend.settings.otp_method_card.inactive')}
        </span>
      </div>
    </div>
  );
}
