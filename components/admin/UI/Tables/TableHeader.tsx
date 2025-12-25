import Link from 'next/link';
import { useTranslation } from "react-i18next";

export interface TableHeaderProps {
    title: string;
    searchPlaceholder: string;
    search: string;
    setSearch: (search: string) => void;
    buttonText?: string;
    buttonLink?: string;
    actionButtonText?: string;
    actionButtonEvent?: () => void;
}

const TableHeader = ({ title, searchPlaceholder, search, setSearch, buttonText, buttonLink, actionButtonText, actionButtonEvent }: TableHeaderProps) => {
    const { t } = useTranslation();

    return (
        <div className="flex justify-between items-center flex-col md:flex-row bg-base-300 p-4 rounded-lg gap-4">
            <h1 className="text-3xl font-bold">{t(title)}</h1>
            <div className="flex gap-2 w-full md:w-auto">
                {actionButtonText && actionButtonEvent &&
                    <button onClick={actionButtonEvent} className="btn btn-secondary h-12">
                        {t(actionButtonText)}
                    </button>
                }
                <input type="text" placeholder={t(searchPlaceholder)} className="input input-bordered h-12" value={search} onChange={(e) => setSearch(e.target.value)} />
                <Link className="btn btn-primary h-12" href={buttonLink || '/admin/projects/create'}>
                    {t(buttonText || 'admin.projects.create_project')}
                </Link>
            </div>
        </div>
    );
};

export default TableHeader;