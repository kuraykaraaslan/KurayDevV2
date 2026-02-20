interface PageHeaderProps {
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

const PageHeader = ({ title, description, className = '', children }: PageHeaderProps) => {
  return (
    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 ${className}`}>
      <div>
        <h1 className="text-3xl font-bold text-base-content">{title}</h1>
        {description && (
          <p className="text-base-content/50 text-sm mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap gap-2 items-center">
          {children}
        </div>
      )}
    </div>
  )
}

export default PageHeader
