import React from 'react'

export interface GenericElementProps {
  label: string
  className?: string
  children?: React.ReactNode
}

const GenericElement: React.FC<GenericElementProps> = ({ label, className = '', children }) => (
  <div className={`form-control flex flex-col ${className}`}>
    <label className="label">
      <span className="label-text">{label}</span>
    </label>
    {children}
  </div>
)

export default GenericElement
