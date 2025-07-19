import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Users,
  FileText,
  Clock,
  FileMinus,
  HardDrive,
  Settings,
  ChevronDown,
  ChevronUp,
  User,
  LayoutDashboard,
  FolderOpen,
  User2,
} from "lucide-react";

const SidebarLayout = ({ children }) => {
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [showTools, setShowTools] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Users", icon: Users, path: "/users" },
    { name: "Logs", icon: Clock, path: "/logs" },
  ];

  const toolItems = [
    { name: "Enroll User", icon: FileText, path: "/enroll" },
    { name: "Remove User", icon: FileMinus, path: "/remove" },
    { name: "Add Admin", icon: HardDrive, path: "/admin" },
    { name: "Services", icon: FolderOpen, path: "/services" },
    { name: "Profile", icon: User2, path: "/profile" },
  ];

  const renderNavItem = (item) => (
    <li key={item.name}>
      <button
        onClick={() => {
          setActiveMenuItem(item.name);
          navigate(item.path);
        }}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md mx-2 w-full text-left
          ${
            activeMenuItem === item.name
              ? "bg-gray-700 text-white"
              : "hover:bg-gray-700 hover:text-white text-gray-400"
          }`}
      >
        <item.icon className="h-5 w-5 mr-3" />
        {item.name}
      </button>
    </li>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-gray-200 flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <img src="/icons/logo.png" className="h-12" alt="logo" />
            <span className="text-lg font-semibold text-white">BARS</span>
          </div>
          <User className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer" />
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-gray-700 rounded-md py-2 pl-10 pr-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm">
              /
            </span>
          </div>
        </div>

        {/* Main Menu */}
        <nav className="flex-1">
          <ul className="space-y-1">
            {menuItems.map(renderNavItem)}

            {/* Tools Section */}
            <li className="mt-4 pt-2 border-t border-red-700">
              <button
                className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
                onClick={() => {
                  setShowTools(!showTools);
                  navigate(renderNavItem.path);
                }}
              >
                Tools
                {showTools ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showTools && (
                <ul className="ml-4 space-y-1">
                  {toolItems.map(renderNavItem)}
                </ul>
              )}
            </li>
          </ul>
        </nav>

        {/* Footer Settings */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              setActiveMenuItem("Settings");
              navigate("/settings");
            }}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-md"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </button>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-400 hover:text-white rounded-md"
          >
            <Settings className="h-5 w-5 mr-3" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
};

export default SidebarLayout;
