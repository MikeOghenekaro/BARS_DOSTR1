import React, { useState, useEffect } from 'react';

const Index = () => {
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [errorScreen, setErrorScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorHeader, setErrorHeader] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [recentUserName, setRecentUserName] = useState('Welcome');
  const [timeMarker, setTimeMarker] = useState('DOST-R1');
  const [userPosition, setUserPosition] = useState('');
  const [userTimeStamp, setUserTimeStamp] = useState('');
  const [recognizedFaceImage, setRecognizedFaceImage] = useState('');
  const [showRecognizedImage, setShowRecognizedImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);

  // Time windows mapping
  const timeWindows = {
    morningTimeIn: "AM In",
    morningTimeOut: "AM Out",
    afternoonTimeIn: "PM In",
    afternoonTimeOut: "PM Out",
  };

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
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  // Toggle loading state
  const toggleLoadingState = (isLoading) => {
    setIsLoading(isLoading);
    setShowInstruction(!isLoading);
  };

  // Clear full display
  const clearFullDisplay = () => {
    setRecentUserName('');
    setStatusMessage('');
    setUserPosition('');
    setUserTimeStamp('');
    setShowRecognizedImage(false);
    setRecognizedFaceImage('');
  };

  // Handle time window button clicks
  const handleTimeWindowClick = async (timeKey) => {
    try {
      clearFullDisplay();
      toggleLoadingState(true);
      const timeWindow = timeWindows[timeKey];
      setTimeMarker(timeWindow);
      console.log("Selected time window: ", timeWindow);
      
      if (window.electronAPI) {
        await window.electronAPI.startRecognition(timeWindow);
      }
    } catch (error) {
      console.error("Error starting recognition:", error);
      showErrorMessages("Recognition Error", error.message);
      toggleLoadingState(false);
    }
  };

  // Update current time
  const updateCurrentTime = () => {
    const now = new Date();
    const gmt8 = new Date(
      now.getTime() + 8 * 60 * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000
    );
    const timeString = gmt8.toLocaleTimeString("en-PH", {
      hour12: false,
      timeZone: "Asia/Manila",
    });
    setCurrentTime(timeString);
  };

  // Handle face recognition status
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onFaceStatus((responseString) => {
        try {
          const response = responseString;
          console.log("Python/Backend response:", response);

          if (response.status === "success" || response.status === "success_with_attendance_error") {
            // Handle successful recognition
            setRecentUserName(response.data?.employeeName || '');
            setStatusMessage(response.message || "ID Success");
            setUserTimeStamp(new Date().toLocaleTimeString());
            setUserPosition(response.employeePosition || "");
            toggleLoadingState(false);
          } else if (response.status === "fail") {
            // Handle recognition failure
            setStatusMessage(response.message || "Face not recognized.");
            setRecentUserName(response.message || "No known face recognized.");
            setUserTimeStamp("N/A");
            setUserPosition("Position");
            console.warn("Face recognition failed:", response.message);
            toggleLoadingState(false);
          } else if (response.status === "error") {
            // Handle errors
            showErrorMessages("Recognition Error", response.message);
            toggleLoadingState(false);
          }
        } catch (error) {
          console.error("Error parsing face status response:", error);
          showErrorMessages("Response Error", "Failed to parse recognition response");
          toggleLoadingState(false);
        }
      });
    }
  }, []);

  // Update time every second
  useEffect(() => {
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Hide loading screen on mount
  useEffect(() => {
    hideLoadingScreen();
  }, []);

  return (
    <>
      {/* Loading Screen */}
      {loadingScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="loading-screen">
            <span className="w-3 h-3 bg-white rounded-full inline-block mx-1 animate-bounce"></span>
            <span className="w-3 h-3 bg-white rounded-full inline-block mx-1 animate-bounce" style={{ animationDelay: '0.1s' }}></span>
            <span className="w-3 h-3 bg-white rounded-full inline-block mx-1 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          </div>
        </div>
      )}

      {/* Background Video */}
      <video 
        src="../assets/videos-background/blue_animated_bg.mp4" 
        className="fixed w-full h-full object-cover -z-20"
        autoPlay 
        muted 
        loop
      />

      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1c065490] via-[#1c06548c] to-[#00000090] -z-10"></div>

      {/* Title Bar */}
      <div className="w-full h-8 max-h-8 bg-transparent flex flex-row items-center justify-between px-2.5 select-none" style={{ WebkitRegionDrag: 'drag' }}>
        <div className="titleBarLogo">
          <img src="../assets/DOST-R1.png" alt="DOST Logo" className="h-6 w-auto" />
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
            style={{ background: 'linear-gradient(to bottom, #4b91ca, #2a5272)' }}
            onClick={handleMaximizeWindow}
          >
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#0d5016] text-[9px] font-bold opacity-0 hover:opacity-100">+</span>
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

      {/* Home Button */}
      <button className="absolute top-10 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
        <a href="home.html" className="text-white no-underline">Home</a>
      </button>

      {/* Error Screen */}
      {errorScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-600">{errorHeader}</h2>
              <button 
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                onClick={closeErrorScreen}
              >
                X
              </button>
            </div>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="m-0 p-0 w-full flex flex-col items-center justify-center bg-transparent" style={{ height: 'calc(100vh - 30px)' }}>
        <div className="mt-5 h-[70%] w-full flex flex-row justify-center bg-transparent">
          <div className="flex flex-row items-center justify-around h-full w-full bg-transparent mb-6">
            {/* Camera Input Section */}
            <div className="h-full w-[59%] min-h-full flex flex-col items-center justify-center bg-black/30 rounded-lg">
              {showInstruction && (
                <div className="text-white text-center text-lg mb-4">
                  Move in front of the camera and select a time window.
                </div>
              )}
              <div className="h-[80%] w-auto rounded-[5%] bg-green-500 hidden"></div>
              {showRecognizedImage && (
                <img 
                  src={recognizedFaceImage} 
                  className="h-[80%] w-[60%] object-cover rounded-[5%]"
                  alt="Recognized Face"
                />
              )}
              {isLoading && (
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {/* Input Info Section */}
            <div className="h-full w-[40%] flex flex-col justify-center bg-transparent rounded-lg">
              {/* Current Time */}
              <div className="text-white text-2xl font-bold text-center mb-4">
                {currentTime}
              </div>

              {/* Status Box */}
              <div className="flex flex-col bg-transparent rounded-lg p-4 mb-4 shadow-lg text-white/85">
                <div className="text-center text-lg mb-2">{statusMessage}</div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{recentUserName}</h3>
                  <h3 className="text-lg">{timeMarker}</h3>
                </div>
                <div className="text-center mt-2">
                  <p>{userPosition}</p>
                  <p>{userTimeStamp}</p>
                </div>
              </div>

              {/* Time Window Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button 
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105"
                  onClick={() => handleTimeWindowClick('morningTimeIn')}
                >
                  AM IN
                </button>
                <button 
                  className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105"
                  onClick={() => handleTimeWindowClick('morningTimeOut')}
                >
                  AM OUT
                </button>
                <button 
                  className="px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-semibold rounded-lg hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300 transform hover:scale-105"
                  onClick={() => handleTimeWindowClick('afternoonTimeIn')}
                >
                  PM IN
                </button>
                <button 
                  className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105"
                  onClick={() => handleTimeWindowClick('afternoonTimeOut')}
                >
                  PM OUT
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Option Buttons */}
        <div className="flex justify-center mt-4">
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105">
            <a href="view-logs.html" className="text-white no-underline">View Logs</a>
          </button>
        </div>
      </div>
    </>
  );
};

export default Index; 