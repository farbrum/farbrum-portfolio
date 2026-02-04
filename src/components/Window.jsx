import { X, Minus, Square } from 'lucide-react'

// Composant "Fenêtre" style logiciel desktop
export default function Window({ title, icon: Icon, children, className = '', onClose }) {
  return (
    <div className={`rounded-lg overflow-hidden border border-rose shadow-[0_0_20px_rgba(200,80,155,0.12)] ${className}`}>
      {/* Barre de titre */}
      <div className="h-9 bg-bg-card border-b border-rose/40 flex items-center justify-between px-3 select-none">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-rose" />}
          <span className="text-xs font-semibold text-gray-300 tracking-wide">{title}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500/60 hover:bg-yellow-500 transition-colors cursor-pointer" />
          <div className="w-3 h-3 rounded-full bg-green-500/60 hover:bg-green-500 transition-colors cursor-pointer" />
          {onClose && (
            <div onClick={onClose} className="w-3 h-3 rounded-full bg-red-500/60 hover:bg-red-500 transition-colors cursor-pointer" />
          )}
        </div>
      </div>
      {/* Contenu */}
      <div className="bg-bg-card">
        {children}
      </div>
    </div>
  )
}
