import { WorkspaceSidebar } from './WorkspaceSidebar'

export function Layout({ children, user, onNavigate, onLogout, active }) {
  const nav = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'newApplication', label: 'New application' },
    { id: 'tracker', label: 'Tracker' },
    { id: 'hotline', label: 'AI Career Coach' },
  ]

  return (
    <div className="shell">
      <header className="topbar">
        <button
          type="button"
          className="brand"
          onClick={() => onNavigate('dashboard')}
        >
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">Job Stop Sign</span>
        </button>
        <nav className="nav-main" aria-label="Primary">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link${active === item.id ? ' is-active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="topbar-user">
          <span className="user-email" title={user?.email}>
            {user?.email}
          </span>
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>
      <div className="shell-body">
        <WorkspaceSidebar />
        <main className="main-area">{children}</main>
      </div>
    </div>
  )
}
