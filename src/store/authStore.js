import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { auth, settings } from '../services/supabase'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      users: [],
      codeEntreprise: 'FARB2025',
      loading: false,

      // ─── Charger les données depuis Supabase ───
      init: async () => {
        set({ loading: true })
        try {
          const [users, code] = await Promise.all([
            auth.getUsers(),
            settings.get('code_entreprise'),
          ])
          set({
            users: users || [],
            codeEntreprise: code || 'FARB2025',
            loading: false,
          })
        } catch (err) {
          console.error('[Auth] init error:', err)
          set({ loading: false })
        }
      },

      // ─── Login via Supabase ───
      login: async (email, password) => {
        const user = await auth.login(email, password)
        if (user) {
          set({ user, isAuthenticated: true })
          return true
        }
        return false
      },

      // ─── Logout ───
      logout: () => set({ user: null, isAuthenticated: false }),

      // ─── Vérifier code entreprise ───
      verifierCodeEntreprise: async (code) => {
        return await auth.verifyCodeEntreprise(code)
      },

      // ─── Modifier code entreprise ───
      setCodeEntreprise: async (newCode) => {
        await auth.setCodeEntreprise(newCode)
        set({ codeEntreprise: newCode.toUpperCase().trim() })
      },

      // ─── Ajouter utilisateur ───
      addUser: async (userData) => {
        const newUser = await auth.addUser(userData)
        if (newUser) {
          set(s => ({ users: [...s.users, newUser] }))
        }
        return newUser
      },

      // ─── Modifier utilisateur ───
      updateUser: async (userId, updates) => {
        const updated = await auth.updateUser(userId, updates)
        if (updated) {
          set(s => ({ users: s.users.map(u => u.id === userId ? { ...u, ...updates } : u) }))
        }
      },

      // ─── Supprimer utilisateur ───
      deleteUser: async (userId) => {
        const ok = await auth.deleteUser(userId)
        if (ok) {
          set(s => ({ users: s.users.filter(u => u.id !== userId) }))
        }
      },
    }),
    {
      name: 'auth-storage',
      // Ne persister que user et isAuthenticated (pas les users ni le code)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
