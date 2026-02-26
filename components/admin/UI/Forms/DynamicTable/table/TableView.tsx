import TableHead from './TableHead'
import TableRows from './TableRows'

interface TableViewProps {
  className?: string
}

function TableView({ className = '' }: TableViewProps) {
  return (
    <div className={`overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px] ${className}`}>
      <table className="table">
        <TableHead />
        <TableRows />
      </table>
    </div>
  )
}

export default TableView
