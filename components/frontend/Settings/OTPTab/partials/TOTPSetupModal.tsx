import HeadlessModal from '@/components/common/Modal';

type Props = {
  open: boolean;
  otpauthUrl?: string | null;
  code: string;
  loadingSetup: boolean;
  verifying: boolean;
  onStartSetup: () => void;
  onVerify: () => void;
  onChangeCode: (v: string) => void;
  onClose: () => void;
};

export default function TOTPSetupModal(props: Props) {
  const {
    open,
    otpauthUrl,
    code,
    loadingSetup,
    verifying,
    onStartSetup,
    onVerify,
    onChangeCode,
    onClose,
  } = props;

  const qrSrc = otpauthUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauthUrl)}` : null;

  return (
    <HeadlessModal
      open={open}
      onClose={onClose}
      title="TOTP Kurulumu"
      size="sm"
      closeOnBackdrop={false}
      closeOnEsc={false}
    >
      <div className="space-y-4">
        {!otpauthUrl && (
          <button
            onClick={onStartSetup}
            disabled={loadingSetup}
            className="btn btn-primary w-full"
          >
            {loadingSetup ? 'Hazırlanıyor…' : 'Kurulumu Başlat'}
          </button>
        )}

        {otpauthUrl && (
          <>
            <div className="flex flex-col items-center gap-3">
              {qrSrc && (
                <img
                  src={qrSrc}
                  alt="Authenticator QR"
                  className="rounded border border-base-300"
                  width={180}
                  height={180}
                />
              )}
              <p className="text-sm text-base-content/70 text-center">
                Authenticator uygulamasıyla QR kodu tarayın veya aşağıdaki bağlantıyı elle ekleyin.
              </p>
              <div className="textarea textarea-bordered w-full text-xs break-all select-all">
                {otpauthUrl}
              </div>
            </div>

            <div className="divider my-2" />

            <input
              maxLength={6}
              value={code}
              onChange={e => onChangeCode(e.target.value)}
              className="input input-bordered w-full text-center text-2xl tracking-widest font-mono"
              placeholder="123456"
            />

            <button
              onClick={onVerify}
              disabled={verifying || code.length !== 6}
              className="btn btn-primary w-full"
            >
              {verifying ? 'Doğrulanıyor…' : 'Etkinleştir'}
            </button>
          </>
        )}
      </div>
    </HeadlessModal>
  );
}
