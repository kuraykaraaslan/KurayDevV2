import { useTranslation } from 'react-i18next';

interface LoadingElementProps {
    title?: string;
}

const LoadingElement = ({ title }: LoadingElementProps) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center justify-center h-[200px]">
            {t('frontend.loading')} {title ? title : '...'}
        </div>
    );
};

export default LoadingElement;