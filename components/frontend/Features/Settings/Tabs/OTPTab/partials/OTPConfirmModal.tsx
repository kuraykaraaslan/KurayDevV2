import HeadlessModal from '@/components/common/Layout/Modal';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  otpSent: boolean;
  otpCode: string;
  sendingOtp: boolean;
  verifying: boolean;
  otpInputRef: React.RefObject<HTMLInputElement>;
  onSendOtp: () => void;
  onVerify: () => void;
  onChangeCode: (v: string) => void;
  onClose: () => void;
};

export default function OTPConfirmModal(props: Props) {
  const { t } = useTranslation();
  const {
    open,
    otpSent,
    otpCode,
    sendingOtp,
    verifying,
    otpInputRef,
    onSendOtp,
    onVerify,
    onChangeCode,
    onClose,
  } = props;

  return (
    <HeadlessModal
      open={open}
      onClose={onClose}
      title={t('frontend.settings.otp_confirm.title')}
      size="sm"
      closeOnBackdrop={false}
      closeOnEsc={false}
    >
      <div className="space-y-4">
        {!otpSent && (
          <button
            onClick={onSendOtp}
            disabled={sendingOtp}
            className="btn btn-primary w-full"
          >
            {sendingOtp ? t('frontend.settings.otp_confirm.sending') : t('frontend.settings.otp_confirm.send_code')}
          </button>
        )}

        {otpSent && (
          <>
            <input
              ref={otpInputRef}
              maxLength={6}
              value={otpCode}
              onChange={e => onChangeCode(e.target.value)}
              className="input input-bordered w-full text-center text-2xl tracking-widest font-mono"
              placeholder={t('frontend.settings.otp_confirm.code_placeholder')}
            />

            <button
              onClick={onVerify}
              disabled={verifying || otpCode.length !== 6}
              className="btn btn-primary w-full"
            >
              {verifying ? t('frontend.settings.otp_confirm.verifying') : t('frontend.settings.otp_confirm.verify')}
            </button>
          </>
        )}
      </div>
    </HeadlessModal>
  );
}
