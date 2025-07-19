/* eslint-disable no-unused-vars */
import React from "react";
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  // Handler functions for window controls
  const handleMinimize = () => {
    if (window.electronAPI && window.electronAPI.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    } else {
      console.log("Minimize Not Configured");
    }
  };

  const handleClose = () => {
    if (window.electronAPI && window.electronAPI.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="window-controls">
        {/* <button
          className="control-button bg-gray-400 minimize-btn"
          id="minimizeWindowBtn"
          onClick={handleMinimize}
        >
          M
        </button> */}
        <button
          className="control-button bg-red-400 close-btn"
          id="closeWindowBtn"
          onClick={handleClose}
        >
          X
        </button>
      </div>
      <Outlet /> {/* This is where the Login component will render */}
    </div>
  );
};

export default AuthLayout;
