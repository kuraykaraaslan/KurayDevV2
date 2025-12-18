import HeadlessModal from '@/components/common/Modal';
import { OTPAction } from '@/types/UserSecurityTypes';

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
      title="Güvenlik Doğrulaması"
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
            {sendingOtp ? 'Kod Gönderiliyor…' : 'Doğrulama Kodu Gönder'}
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
              placeholder="123456"
            />

            <button
              onClick={onVerify}
              disabled={verifying || otpCode.length !== 6}
              className="btn btn-primary w-full"
            >
              {verifying ? 'Doğrulanıyor…' : 'Doğrula'}
            </button>
          </>
        )}
      </div>
    </HeadlessModal>
  );
}
