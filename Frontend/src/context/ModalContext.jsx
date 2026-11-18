/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'

const ModalContext = createContext(null)

export function ModalProvider({ children }) {
  const [isNewFeatureModalOpen, setIsNewFeatureModalOpen] = useState(false)
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false)
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false)
  const [editingSprint, setEditingSprint] = useState(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  // Abertura e fecho do modal de Novo Pedido
  const openNewFeatureModal = useCallback(() => {
    setIsNewFeatureModalOpen(true)
    setIsProfileMenuOpen(false)
  }, [])

  const closeNewFeatureModal = useCallback(() => {
    setIsNewFeatureModalOpen(false)
  }, [])

  // Abertura e fecho do modal de Criar User Story
  const openCreateStoryModal = useCallback(() => {
    setIsCreateStoryModalOpen(true)
    setIsProfileMenuOpen(false)
  }, [])

  const closeCreateStoryModal = useCallback(() => {
    setIsCreateStoryModalOpen(false)
  }, [])

  // Abertura e fecho do modal de Criar / Editar Sprint
  const openSprintModal = useCallback((sprint = null) => {
    setEditingSprint(sprint || null)
    setIsSprintModalOpen(true)
    setIsProfileMenuOpen(false)
  }, [])

  const closeSprintModal = useCallback(() => {
    setIsSprintModalOpen(false)
    setEditingSprint(null)
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
    setIsSprintModalOpen(false)
    setEditingSprint(null)
    setIsProfileMenuOpen(false)
  }, [])

  const value = {
    isNewFeatureModalOpen,
    isCreateStoryModalOpen,
    isSprintModalOpen,
    editingSprint,
    isProfileMenuOpen,
    openNewFeatureModal,
    closeNewFeatureModal,
    openCreateStoryModal,
    closeCreateStoryModal,
    openSprintModal,
    closeSprintModal,
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
