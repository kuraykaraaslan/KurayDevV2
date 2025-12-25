'use client'
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useTableContext, ColumnDef, ActionButton } from './TableContext';

interface TableBodyProps {
    className?: string;
    emptyText?: string;
}

function TableBody({ className = '', emptyText }: TableBodyProps) {
    const { t } = useTranslation();
    const { data = [], columns, actions, idKey, loading, handleActionClick } = useTableContext();

    const totalColumns = columns.length + (actions && actions.length > 0 ? 1 : 0);

    return (
        <div className={`overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px] ${className}`}>
            <table className="table">
                <thead className="bg-base-300 h-12">
                    <tr className="h-12">
                        {columns.map((col: ColumnDef<any>) => (
                            <th key={col.key} className={col.className}>
                                {t(col.header)}
                            </th>
                        ))}
                        {actions && actions.length > 0 && <th>{t('common.action')}</th>}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={totalColumns} className="text-center py-8">
                                <span className="loading loading-spinner loading-lg"></span>
                            </td>
                        </tr>
                    ) : !data || data.length === 0 ? (
                        <tr>
                            <td colSpan={totalColumns} className="text-center py-8">
                                {emptyText ? t(emptyText) : t('common.no_data')}
                            </td>
                        </tr>
                    ) : (
                        data.map((item: any, index: number) => (
                            <tr key={String(item[idKey]) || index} className="h-12 hover:bg-primary hover:bg-opacity-10">
                                {columns.map((col: ColumnDef<any>) => (
                                    <td key={col.key} className={col.className} onClick={() => col.onClick ? col.onClick(item, index) : undefined} style={{ cursor: col.onClick ? 'pointer' : 'default' }}>
                                        {col.accessor(item, index)}
                                    </td>
                                ))}
                                {actions && actions.length > 0 && (
                                    <td className="flex gap-2">
                                        {actions.map((action: ActionButton<any>, actionIndex: number) => (
                                            action.href ? (
                                                <Link
                                                    key={actionIndex}
                                                    href={action.href(item)}
                                                    className={`btn btn-sm ${action.className || 'btn-primary'} ${action.hideOnMobile ? 'hidden md:flex' : ''}`}
                                                >
                                                    {t(action.label)}
                                                </Link>
                                            ) : (
                                                <button
                                                    key={actionIndex}
                                                    onClick={() => handleActionClick(action, item, index)}
                                                    className={`btn btn-sm ${action.className || 'btn-primary'} ${action.hideOnMobile ? 'hidden md:flex' : ''}`}
                                                >
                                                    {t(action.label)}
                                                </button>
                                            )
                                        ))}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default TableBody;
