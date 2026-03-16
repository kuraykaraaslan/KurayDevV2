'use client'
import { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

const Table = ({ children, className = '' }: TableProps) => {
  return <div className={`container mx-auto ${className}`}>{children}</div>
}

export default Table
