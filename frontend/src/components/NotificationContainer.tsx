import React from 'react'
import { useNotification } from '../contexts/NotificationContext'
import Toast from './Toast'
import Modal from './Modal'

const NotificationContainer: React.FC = () => {
  const { toasts, modal, removeToast, hideModal } = useNotification()

  return (
    <>
      {/* Toast Container - Bottom Right */}
      <div 
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal && <Modal modal={modal} onClose={hideModal} />}
    </>
  )
}

export default NotificationContainer
