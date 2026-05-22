import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Oggi', icon: '📅' },
  { to: '/farmaci', label: 'Farmaci', icon: '💊' },
  { to: '/profilo', label: 'Profilo', icon: '⚙️' },
];

export default function Layout() {
  return (
    <div className="mx-auto flex h-full max-w-[430px] flex-col bg-slate-50">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-[430px] border-t border-slate-200 bg-white">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
                isActive ? 'text-brand-600' : 'text-slate-500'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
