import React from 'react'
import { X } from 'lucide-react'
import { Modal as ModalType } from '../contexts/NotificationContext'

interface ModalProps {
  modal: ModalType
  onClose: () => void
}

const Modal: React.FC<ModalProps> = ({ modal, onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getButtonStyles = (variant?: 'primary' | 'danger' | 'secondary') => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400'
      case 'primary':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
            {modal.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p id="modal-description" className="text-gray-700 leading-relaxed">
            {modal.message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {modal.actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`
                flex-1 px-4 py-2.5 rounded-lg font-medium
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${getButtonStyles(action.variant)}
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Modal
