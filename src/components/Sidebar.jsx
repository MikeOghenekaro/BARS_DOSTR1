import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Users,
  Clock,
  Settings,
  ChevronDown,
  ChevronUp,
  User,
  LayoutDashboard,
  FolderOpen,
  User2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CirclePlus,
  CircleMinus,
  UserPlus,
  MonitorCog,
} from "lucide-react";

const SidebarLayout = ({ children }) => {
  const [activeMenuItem, setActiveMenuItem] = useState("Dashboard");
  const [showTools, setShowTools] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // New state for sidebar visibility
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // Navigate to login page after logout
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" }, // Updated path to /home
    { name: "Users", icon: Users, path: "/users" },
    { name: "Logs", icon: Clock, path: "/logs" },
]

  const toolItems = [
    { name: "Enroll User", icon: CirclePlus, path: "/enroll" },
    // { name: "Remove User", icon: CircleMinus, path: "/remove" }, // Assuming a /remove route exists or will be added
    // { name: "Add Admin", icon: UserPlus, path: "/add-admin" }, // Updated path to /add-admin
    // { name: "Services", icon: MonitorCog, path: "/services" },
    // { name: "Profile", icon: User2, path: "/profile" },
  ];

  const renderNavItem = (item) => (
    <li key={item.name}>
      <button
        onClick={() => {
          setActiveMenuItem(item.name);
          navigate(item.path);
        }}
        className={`flex items-center py-2 text-sm font-medium rounded-md mx-2 w-full text-left
          ${isSidebarOpen ? "px-4" : "justify-center"}
          ${
            activeMenuItem === item.name
              ? "bg-gray-700 text-white"
              : "hover:bg-gray-700 hover:text-white text-gray-400"
          }`}
      >
        <item.icon className={`h-5 w-5 ${isSidebarOpen ? "mr-3" : ""}`} />
        {isSidebarOpen && item.name} {/* Conditionally render text */}
      </button>
    </li>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-gray-800 text-gray-200 flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-64" : "w-20"}`} // Dynamic width
      >
        {/* Logo/Brand and Toggle Button */}
        <div
          className={`flex items-center p-4 border-b border-gray-700 ${
            isSidebarOpen ? "justify-between" : "justify-center"
          }`}
        >
          <div
            className={`flex items-center space-x-2 ${
              !isSidebarOpen && "hidden"
            }`}
          >
            {/* Using a placeholder image for the logo as /icons/logo.png is not provided */}
            <img src="/icons/logo.png" className="h-12" alt="logo" />
            <span className="text-lg font-semibold text-white">BARS</span>
          </div>
          {/* User icon always visible, but adjusted position when collapsed */}
          <User
            className={`h-6 w-6 text-gray-400 hover:text-white cursor-pointer ${
              isSidebarOpen ? "" : "mx-auto"
            }`}
          />
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <div
              className={`absolute inset-y-0 left-0 pl-3 flex items-center ${
                isSidebarOpen ? "" : "w-full justify-center"
              }`}
            >
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            {isSidebarOpen && ( // Conditionally render search input
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-gray-700 rounded-md py-2 pl-10 pr-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
            {isSidebarOpen && ( // Conditionally render search shortcut
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-sm">
                /
              </span>
            )}
          </div>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map(renderNavItem)}

            {/* Tools Section */}
            <li className="mt-4 pt-2 border-t border-gray-700">
              {" "}
              {/* Changed border-red-700 to border-gray-700 for consistency */}
              <button
                className={`flex items-center justify-between w-full py-2 text-sm font-medium text-gray-400 hover:text-white
                  ${isSidebarOpen ? "px-4" : "justify-center"}`}
                onClick={() => setShowTools(!showTools)}
              >
                {isSidebarOpen && "Tools"} {/* Conditionally render text */}
                {isSidebarOpen ? (
                  showTools ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )
                ) : (
                  <FolderOpen className="h-5 w-5" /> // Icon when collapsed
                )}
              </button>
              {showTools &&
                isSidebarOpen && ( // Only show sub-menu when sidebar is open
                  <ul className="ml-4 space-y-1">
                    {toolItems.map(renderNavItem)}
                  </ul>
                )}
              {showTools &&
                !isSidebarOpen && ( // Tooltip or popover for collapsed state (basic implementation)
                  <div className="absolute left-20 ml-2 p-2 bg-gray-700 text-white text-xs rounded-md shadow-lg z-10 whitespace-nowrap">
                    Tools
                  </div>
                )}
            </li>
          </ul>
        </nav>

        {/* Footer Settings and Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              setActiveMenuItem("Settings");
              navigate("/settings"); // Assuming a /settings route exists
            }}
            className={`flex items-center w-full py-2 text-sm font-medium text-gray-400 hover:text-white rounded-md
              ${isSidebarOpen ? "px-2" : "justify-center"}`}
          >
            <Settings className={`h-5 w-5 ${isSidebarOpen ? "mr-3" : ""}`} />
            {isSidebarOpen && "Settings"}
          </button>

          <button
            onClick={handleLogout}
            className={`flex items-center w-full py-2 text-sm font-medium text-red-400 hover:text-white rounded-md mt-2
              ${isSidebarOpen ? "px-2" : "justify-center"}`}
          >
            <LogOut className={`h-5 w-5 ${isSidebarOpen ? "mr-3" : ""}`} />{" "}
            {/* Using LogOut icon */}
            {isSidebarOpen && "Log Out"}
          </button>
        </div>
      </aside>

      {/* Toggle Button for Sidebar */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-1/2 -translate-y-1/2 z-20 p-2 bg-gray-700 text-white rounded-full shadow-lg
                   transition-all duration-300 ease-in-out hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
        style={{ left: isSidebarOpen ? "15rem" : "4rem" }} // Position based on sidebar width
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </button>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "ml-0" : "ml-0"}`} // Margin adjusted by sidebar width
      >
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
