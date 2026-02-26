import { useTableContext } from './TableContext'
import DefaultGridItem from './DefaultGridItem'

interface TableGridProps {
  className?: string
}

function TableGrid({ className = '' }: TableGridProps) {
  const { data, idKey, columns, actions, handleActionClick, gridItemRenderer, gridClassName } =
    useTableContext()

  return (
    <div
      className={`mt-4 ${gridClassName || 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'} ${className}`}
    >
      {data.map((item: any, index: number) => (
        <div key={String(item[idKey]) || index}>
          {gridItemRenderer ? (
            gridItemRenderer({ item, index, actions, handleActionClick })
          ) : (
            <DefaultGridItem
              item={item}
              index={index}
              actions={actions}
              handleActionClick={handleActionClick}
              columns={columns}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default TableGrid
