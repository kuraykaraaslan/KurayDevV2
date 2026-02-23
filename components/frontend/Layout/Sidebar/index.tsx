'use client'
import Menu from '../Menu'
import { MenuItem } from '@/types/ui/UITypes'

const closeSidebar = () => {
  const drawerCheckbox = document.getElementById('my-drawer') as HTMLInputElement
  if (drawerCheckbox) drawerCheckbox.checked = false
}

const Sidebar = ({ menuItems }: { menuItems: MenuItem[] }) => {
  return (
    <div className="drawer-side" style={{ zIndex: 8 }}>
      <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay backdrop-blur-sm" />

      <aside className="flex flex-col w-72 h-full bg-base-100 border-r border-base-200 shadow-2xl">
        {/* Close button */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-base-200">
          <span className="text-base font-semibold text-base-content opacity-70 tracking-wide uppercase text-xs">
            Menu
          </span>
          <button
            onClick={closeSidebar}
            className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content hover:bg-base-200"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="menu menu-md gap-1 w-full p-0">
            <Menu isSidebar={true} menuItems={menuItems} onItemClick={closeSidebar} />
          </ul>
        </nav>
      </aside>
    </div>
  )
}

export default Sidebar
