/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [isNewFeatureModalOpen, setIsNewFeatureModalOpen] = useState(false)
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false)
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  // Abertura e fecho do modal de Novo Pedido (Figma 342:2327)
  const openNewFeatureModal = useCallback(() => {
    setIsNewFeatureModalOpen(true)
    setIsProfileMenuOpen(false)
  }, [])

  const closeNewFeatureModal = useCallback(() => {
    setIsNewFeatureModalOpen(false)
  }, [])

  // Abertura e fecho do modal de Criar User Story (Figma 342:2074)
  const openCreateStoryModal = useCallback(() => {
    setIsCreateStoryModalOpen(true)
    setIsProfileMenuOpen(false)
  }, [])

  const closeCreateStoryModal = useCallback(() => {
    setIsCreateStoryModalOpen(false)
  }, [])

  // Abertura e alternância do seletor de papéis RBAC
  const openRoleSwitcher = useCallback(() => {
    setIsRoleSwitcherOpen(true)
    setIsProfileMenuOpen(false)
  }, [])

  const closeRoleSwitcher = useCallback(() => {
    setIsRoleSwitcherOpen(false)
  }, [])

  const toggleRoleSwitcher = useCallback(() => {
    setIsRoleSwitcherOpen((prev) => !prev)
    setIsProfileMenuOpen(false)
  }, [])

  // Menu de perfil no cabeçalho
  const toggleProfileMenu = useCallback(() => {
    setIsProfileMenuOpen((prev) => !prev)
  }, [])

  const closeProfileMenu = useCallback(() => {
    setIsProfileMenuOpen(false)
  }, [])

  const closeAllModals = useCallback(() => {
    setIsNewFeatureModalOpen(false)
    setIsCreateStoryModalOpen(false)
    setIsRoleSwitcherOpen(false)
    setIsProfileMenuOpen(false)
  }, [])

  const value = {
    isNewFeatureModalOpen,
    isCreateStoryModalOpen,
    isRoleSwitcherOpen,
    isProfileMenuOpen,
    openNewFeatureModal,
    closeNewFeatureModal,
    openCreateStoryModal,
    closeCreateStoryModal,
    openRoleSwitcher,
    closeRoleSwitcher,
    toggleRoleSwitcher,
    toggleProfileMenu,
    closeProfileMenu,
    closeAllModals,
  }

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal deve ser utilizado dentro de um <ModalProvider>')
  }
  return context
}

export default ModalContext
