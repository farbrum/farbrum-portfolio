import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, password) => {
        const users = [
          { id: '1', email: 'admin@test.com', password: 'password', nom: 'Eddy', prenom: '', role: 'admin' },
          { id: '2', email: 'user@test.com', password: 'password', nom: 'Ouvrier', prenom: 'Jean', role: 'ouvrier' },
        ]
        const found = users.find(u => u.email === email && u.password === password)
        if (found) { const { password: _, ...safe } = found; set({ user: safe, isAuthenticated: true }); return true }
        return false
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
)
