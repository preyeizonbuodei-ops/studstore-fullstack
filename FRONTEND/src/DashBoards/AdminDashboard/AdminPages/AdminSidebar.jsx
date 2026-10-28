
import { useState } from "react";
import {
  File,
  GraduationCap,
  Home,
  LogOutIcon,
  Users2,
  BellIcon,
  Book,
  Menu,
  X,
  Settings,
  House,
  MessagesSquare
} from "lucide-react";

import { NavLink, Outlet } from "react-router-dom";
import { AdminRegister } from "../../../Store/AdminStore";

const AdminSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const Logout = AdminRegister((state) => state.Logout);
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-3 transition duration-200 ${
      isActive
        ? "bg-white text-blue-950 font-semibold"
        : "text-white hover:bg-white hover:text-blue-950"
    }`;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-100 md:grid md:grid-cols-[250px_minmax(0,1fr)]">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[250px] flex-col overflow-y-auto bg-blue-950 text-white transition-transform duration-300 md:sticky md:top-0 md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="mb-4 flex items-center justify-between gap-3 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.20)]">
          <div className="flex items-center gap-3">
            <GraduationCap className="size-10 shrink-0 text-blue-400" />

            <div>
              <h1 className="font-semibold">E-Learning</h1>
              <p className="text-sm text-gray-300">Admin</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="rounded-lg p-2 hover:bg-blue-900 md:hidden"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2 px-3 pb-4">
          <NavLink
            to="/admin-dashboard"
            end
            onClick={closeSidebar}
            className={navLinkClass}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin-dashboard/departments"
            onClick={closeSidebar}
            className={navLinkClass}
          >
            <Book size={20} />
            <span>Departments</span>
          </NavLink>

          <NavLink
            to="/admin-dashboard/major-areas"
            onClick={closeSidebar}
            className={navLinkClass}
          >
            <File size={20} />
            <span>Major Areas</span>
          </NavLink>

          <NavLink
            to="/admin-dashboard/topics"
            onClick={closeSidebar}
            className={navLinkClass}
          >
            <House size={20} />
            <span>Topics</span>
          </NavLink>

          <NavLink
            to="/admin-dashboard/comments"
            onClick={closeSidebar}
            className={navLinkClass}
          >
            <MessagesSquare size={20} />
            <span>Students Voices</span>
          </NavLink>

          <div className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition duration-200 hover:bg-white hover:text-blue-950">
            <File size={20} />
            <span>Resources</span>
          </div>

          <NavLink
            to="/admin-dashboard/users"
            onClick={closeSidebar}
            className={navLinkClass}
          >
            <Users2 size={20} />
            <span>Users</span>
          </NavLink>

          <NavLink
            to="/admin-dashboard/settings"
            onClick={closeSidebar}
            className={navLinkClass}
          >
            <Users2 size={20} />
            <span>Settings</span>
          </NavLink>

          <button
              className="flex gap-2 rounded py-3 px-3 hover:bg-white hover:text-black"
              onClick={async () => {
                  await Logout();
                  setIsOpen(false);
                  navigate("/admin-login");
              }}
          >
              <LogOutIcon />
              Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.12)] sm:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="rounded-lg p-2 text-blue-950 transition hover:bg-gray-100 md:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex flex-1 items-center justify-end gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
            >
              <BellIcon size={21} />
            </button>

            <p className="rounded-full bg-blue-950 px-3 py-2 text-sm font-medium text-white">
              Ad
            </p>

            <p className="hidden text-sm text-gray-500 sm:block">
              Admin
            </p>
          </div>
        </header>

        {/* Nested Pages */}
        <div className="min-w-0 p-3 sm:p-5 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminSidebar;
