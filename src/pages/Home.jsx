import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [errorScreen, setErrorScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorHeader, setErrorHeader] = useState('');
  const navigate = useNavigate();

  // Show loading screen
  const showLoadingScreen = () => {
    setLoadingScreen(true);
  };

  // Hide loading screen
  const hideLoadingScreen = () => {
    setLoadingScreen(false);
  };

  // Show error screen
  const showErrorMessages = (header, message) => {
    setErrorHeader(header || 'Error');
    setErrorMessage(message || 'An unexpected error occurred.');
    setErrorScreen(true);
  };

  // Close error screen
  const closeErrorScreen = () => {
    setErrorScreen(false);
  };

  // Window control handlers
  const handleCloseWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const handleMinimizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow(); // Corrected to use minimizeWindow
    }
  };

  // Navigation handlers
  const handleSignIn = async () => {
    try {
      showLoadingScreen();
      // if (window.electronAPI) {
      //   await window.electronAPI.navigateTo('/login');  
      // }
      navigate('/login'); // Use react-router's navigate function
      hideLoadingScreen();
    } catch (error) {
      console.error("There was an error: ", error);
      showErrorMessages("Navigation Error", error.message);
    } finally {
      hideLoadingScreen(); // Ensure loading screen is hidden even on error
    }
  };

  const handleStartApp = () => {
    navigate('/recognize'); // This was the previous fix, now confirmed working
  };

  // Set container height on window resize
  useEffect(() => {
    const setContainerHeight = () => {
      const titleBar = document.querySelector(".titleBar");
      const header = document.querySelector(".header");
      const container = document.querySelector(".container");
      
      if (titleBar && header && container) {
        const totalHeight = window.innerHeight;
        const titleBarHeight = titleBar.offsetHeight;
        const headerHeight = header.offsetHeight;
        container.style.height = totalHeight - titleBarHeight - headerHeight + "px";
      }
    };

    window.addEventListener("resize", setContainerHeight);
    setContainerHeight(); // Initial call
    hideLoadingScreen(); // Hide loading screen on mount

    return () => {
      window.removeEventListener("resize", setContainerHeight);
    };
  }, []);

  return (
    // Removed bg-gray-100 from this outermost div to allow the video to show
    <div className="relative flex flex-col items-center justify-center h-screen w-screen">
      {/* Loading Screen */}
      {loadingScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"> {/* Highest z-index */}
          <div className="loading-screen">
            <span className="w-3 h-3 bg-white rounded-full inline-block mx-1 animate-bounce"></span>
            <span className="w-3 h-3 bg-white rounded-full inline-block mx-1 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-3 h-3 bg-white rounded-full inline-block mx-1 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </div>
        </div>
      )}

      {/* Background Video */}
      <video 
        src="/videos/ai-bg-blue.mp4"
        className="fixed w-full h-full object-cover z-5" // Lowest z-index
        autoPlay 
        muted 
        loop
      />

      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1c065490] via-[#1c06548c] to-[#00000090] z-6"></div> {/* Middle z-index */}

      {/* Title Bar */}
      <div className="w-full h-8 max-h-8 bg-transparent flex flex-row items-center justify-between px-2.5 select-none z-7" style={{ WebkitAppRegion: 'drag' }}>
        <div className="titleBarLogo">
          <img src="/icons/DOST-R1.png" alt="DOST Logo" className="h-6 w-auto" />
        </div>
        <div className="flex-grow text-center text-sm text-white font-medium w-1/3">BARS</div>
        <div className="flex flex-row justify-end gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <div 
            className="w-5 h-[18px] rounded-[20%] border border-black/20 cursor-pointer relative transition-all duration-200 ease-in-out hover:scale-110"
            style={{ background: 'linear-gradient(to bottom, #505050, #131313)' }}
            onClick={handleMinimizeWindow}
          >
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#995700] text-[9px] font-bold opacity-0 hover:opacity-100">−</span>
          </div>
          <div 
            className="w-5 h-[18px] rounded-[20%] border border-black/20 cursor-pointer relative transition-all duration-200 ease-in-out hover:scale-110"
            style={{ background: 'linear-gradient(to bottom, #ad403a, #471a18)' }}
            onClick={handleCloseWindow}
          >
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#8b0000] text-[9px] font-bold opacity-0 hover:opacity-100">×</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col items-start justify-center pl-[1%] w-full h-24 z-7">
        <p className="text-center text-[3.5rem] text-[#e7e5ec]">BARS</p>
        <p className="text-center text-base text-[#e7e5ec]">Biometric Attendance Records System</p>
      </div>

      {/* Main Container */}
      <div className="m-0 p-0 w-full flex flex-col items-center justify-center bg-transparent z-7" style={{ height: 'calc(100vh - 30px)' }}>
        <button 
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 mb-4"
          onClick={handleStartApp}
        >
          Get Started
        </button>
        <button 
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105"
          onClick={handleSignIn}
        >
          Sign In
        </button>
      </div>

      {/* Error Screen */}
      {errorScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">{errorHeader}</h2>
              <p className="text-gray-700 mb-6">{errorMessage}</p>
              <button 
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                onClick={closeErrorScreen}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
