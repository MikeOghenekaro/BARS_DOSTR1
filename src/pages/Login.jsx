import React, { useState, useEffect } from "react";

import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Square,
  CheckSquare,
  ArrowBigLeftIcon,
} from "lucide-react";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

    // Window control handlers
  const handleCloseWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const handleMinimizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleNavigateHome = () => {
    if (window.electronAPI && window.electronAPI.navigateTo) {
      navigate("/home");

    } else {
      console.warn("Navigate Failed Woefully");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen min-w-screen bg-gray-70 flex flex-col items-center justify-center font-sans ">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="text-lg font-semibold text-gray-800">BARS ADMIN</div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 text-sm"></span>
        </div>
        
      </header>
      <div className="flex flex-col items-center justify-center mt-20">
        <div className="bg-blue-700 p-3 rounded-xl mb-6 shadow-md">
          <img src="/icons/logo.png" className=" h-14" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 ">Welcome</h1>
        <p className="text-gray-600 text-md mb-8 text-center max-w-sm ">
          Enter admin credentials to gain access
        </p>
        <p>{message}</p>

        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* EMail Input  */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address<span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="email"
                name="email"
                id="email"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="admin-user@dostr1.ph"
                onChange={handleChange}
                // value={email}
                required
              />
            </div>
          </div>

          {/*Password Input*/}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password<span className="text-red-500">*</span>
              </label>
              {/* <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </a> */}
            </div>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="••••••••"
                // value={password}
                onChange={handleChange}
                required
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Login
          </button>
          <div className="w-full flex justify-center items-center text-center bg-transparent border-transparent">
            <div
              onClick={handleNavigateHome}
              id="home-button"
              className="w-full cursor-pointer flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowBigLeftIcon
                className="h-5 w-5 text-white"
                aria-hidden="true"
              />
              Home
            </div>
          </div>
        </form>
        {/* Terms and Privacy Policy */}
        {/* <p className="mt-6 text-center text-xs text-gray-500">
          By clicking continue, you agree to our{" "}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
            Privacy Policy
          </a>
        </p> */}
      </div>
    </div>
  );
}
