import React from 'react'
import { MouseEvent } from 'react'

interface ActionButtonProps {
  text?: string
  className?: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void | Promise<void>
  element?: React.ReactNode
}

interface FormHeaderProps {
  title: string
  titleClassName?: string
  className?: string
  actionButtons?: ActionButtonProps[]
}

const FormHeader: React.FC<FormHeaderProps> = ({
  title,
  titleClassName = '',
  className = '',
  actionButtons = [],
}) => (
  <div className={`flex justify-between items-center flex-row ${className}`}>
    <h1 className={`text-3xl font-bold h-16 items-center ${titleClassName}`}>{title}</h1>
    <div className="flex gap-2 h-16">
      {actionButtons.map((button, index) =>
        button.element ? (
          <div key={index}>{button.element}</div>
        ) : (
          <button
            key={index}
            onClick={button.onClick}
            className={`btn btn-sm h-12 ${button.className || 'btn-primary'}`}
          >
            {button.text}
          </button>
        )
      )}
    </div>
  </div>
)

export default FormHeader
