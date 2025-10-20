import React, { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export interface ModalAction {
  label: string
  onClick: () => void | Promise<void>
  variant?: 'primary' | 'danger' | 'secondary'
}

export interface Modal {
  id: string
  title: string
  message: string
  actions: ModalAction[]
  onClose?: () => void
}

interface NotificationContextType {
  toasts: Toast[]
  modal: Modal | null
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showModal: (title: string, message: string, actions: ModalAction[], onClose?: () => void) => void
  showConfirm: (message: string, onConfirm: () => void | Promise<void>, title?: string) => void
  hideModal: () => void
  removeToast: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modal, setModal] = useState<Modal | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showModal = useCallback((
    title: string,
    message: string,
    actions: ModalAction[],
    onClose?: () => void
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setModal({ id, title, message, actions, onClose })
  }, [])

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void | Promise<void>,
    title: string = 'Confirm Action'
  ) => {
    showModal(
      title,
      message,
      [
        {
          label: 'Cancel',
          onClick: () => hideModal(),
          variant: 'secondary'
        },
        {
          label: 'Confirm',
          onClick: async () => {
            await onConfirm()
            hideModal()
          },
          variant: 'danger'
        }
      ]
    )
  }, [showModal])

  const hideModal = useCallback(() => {
    if (modal?.onClose) {
      modal.onClose()
    }
    setModal(null)
  }, [modal])

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        modal,
        showToast,
        showModal,
        showConfirm,
        hideModal,
        removeToast
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
