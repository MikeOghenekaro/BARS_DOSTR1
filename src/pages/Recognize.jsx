import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for routing

const Recognize = () => {
  // State for UI elements and data
  const [loadingScreen, setLoadingScreen] = useState(false); // For the main app loading overlay
  const [errorScreen, setErrorScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorHeader, setErrorHeader] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [statusMessage, setStatusMessage] = useState('Camera initializing...'); // Initial status message
  const [recentUserName, setRecentUserName] = useState('Welcome');
  const [timeMarker, setTimeMarker] = useState('DOST-R1');
  const [userPosition, setUserPosition] = useState('');
  const [userTimeStamp, setUserTimeStamp] = useState('');
  const [recognizedFaceImage, setRecognizedFaceImage] = useState('');
  const [showRecognizedImage, setShowRecognizedImage] = useState(false); // Controls visibility of captured image
  const [isLoading, setIsLoading] = useState(false); // Controls the spinner and instruction message
  const [showInstruction, setShowInstruction] = useState(true);

  // Camera-related state and refs
  const videoRef = useRef(null); // Ref for the <video> element
  const cameraStream = useRef(null); // Ref to hold the MediaStream object
  const [selectedCameraId, setSelectedCameraId] = useState('default'); // Camera ID from settings

  // Timeout ID for clearing the recognized face image
  const imageClearTimeoutId = useRef(null);

  // React Router navigate hook
  const navigate = useNavigate();

  // Time windows mapping
  const timeWindows = {
    morningTimeIn: "AM In",
    morningTimeOut: "AM Out",
    afternoonTimeIn: "PM In",
    afternoonTimeOut: "PM Out",
  };

  // --- UI State Management Functions ---
  const showLoadingScreen = () => setLoadingScreen(true);
  const hideLoadingScreen = () => setLoadingScreen(false);

  const showErrorMessages = (header, message) => {
    setErrorHeader(header || 'Error');
    setErrorMessage(message || 'An unexpected error occurred.');
    setErrorScreen(true);
  };

  const closeErrorScreen = () => setErrorScreen(false);

  const toggleLoadingState = (isLoading) => {
    setIsLoading(isLoading);
    setShowInstruction(!isLoading); // Hide instructions when loading/processing
  };

  const clearFullDisplay = () => {
    setRecentUserName('');
    setStatusMessage('');
    setUserPosition('');
    setUserTimeStamp('');
    setShowRecognizedImage(false); // Hide the image
    setRecognizedFaceImage(''); // Clear image source

    // Clear any pending timeout for image clearing
    if (imageClearTimeoutId.current) {
      clearTimeout(imageClearTimeoutId.current);
      imageClearTimeoutId.current = null;
    }
  };

  // --- Window Control Handlers (Electron API) ---
  const handleCloseWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.windowClose(); // Use windowClose as per main.js
    }
  };

  const handleMinimizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.windowMinimize(); // Use windowMinimize as per main.js
    }
  };

  const handleMaximizeWindow = () => {
    // Note: Maximize/Restore logic is typically handled by Electron's frame:false
    // If you need a custom maximize/restore, you'd implement it here.
    // For now, let's assume this button is for a simple maximize.
    // If you have a specific Electron API for maximize, use it.
    console.log("Maximize button clicked. Implement Electron maximize API if available.");
    // window.electronAPI.windowMaximize(); // Example if such an API exists
  };

  // --- Camera Control Functions ---

  /**
   * Starts the camera stream using the specified deviceId or the default.
   * Includes robust error handling for OverconstrainedError.
   * @param {string|null} deviceIdToUse - The deviceId of the camera to use, or null/undefined for default.
   */
  const startCamera = async (deviceIdToUse) => {
    console.log(`Camera Control: Attempting to start camera with ID: ${deviceIdToUse}`);
    stopCamera(); // Ensure any existing stream is stopped
    setStatusMessage("Initializing camera...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatusMessage("getUserMedia is not supported by this browser. Cannot access camera.");
      console.error("Camera Control: getUserMedia not supported.");
      return;
    }

    let constraints = { video: true }; // Default to any available camera

    if (deviceIdToUse && deviceIdToUse !== "default") {
      constraints = { video: { deviceId: { exact: deviceIdToUse } } };
      console.log(`Camera Control: Using exact deviceId constraint: ${deviceIdToUse}`);
    } else {
      console.log("Camera Control: Using generic video constraint (browser will pick default).");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStream.current = stream; // Store the MediaStream object in ref
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        console.log("Camera Control: Video stream attached and playing.");
      }
      setStatusMessage("Camera active. Position your face.");
      console.log("Camera Control: Camera started successfully.");
    } catch (err) {
      console.error("Camera Control: Error accessing camera on first attempt:", err);
      if (err.name === "OverconstrainedError") {
        setStatusMessage(
          "Selected camera not found or busy. Attempting to use default camera..."
        );
        console.warn("Camera Control: OverconstrainedError caught. Retrying with generic video constraint.");

        try {
          const genericConstraints = { video: true };
          const stream = await navigator.mediaDevices.getUserMedia(genericConstraints);
          cameraStream.current = stream; // Store the MediaStream object in ref
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            console.log("Camera Control: Generic video stream attached and playing.");
          }
          setStatusMessage("Camera active (using default). Position your face.");
          console.log("Camera Control: Camera started successfully with default camera.");
        } catch (retryErr) {
          console.error("Camera Control: Retry with generic constraints failed:", retryErr);
          setStatusMessage(`Camera access failed: ${retryErr.message}. No camera available.`);
        }

      } else if (err.name === "NotFoundError" || err.name === "SourceUnavailableError") {
        setStatusMessage(
          "Camera not found or unavailable. Please check connections or settings."
        );
        console.error("Camera Control: Camera not found or unavailable.");
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatusMessage(
          "Camera access denied. Please grant permission in your system settings."
        );
        console.error("Camera Control: Camera access denied by user/system.");
      } else {
        setStatusMessage(`Camera access failed: ${err.message}`);
        console.error(`Camera Control: Generic camera access error: ${err.message}`);
      }
    }
  };

  /**
   * Stops the current camera stream.
   */
  const stopCamera = () => {
    console.log("Camera Control: Attempting to stop camera.");
    if (cameraStream.current) {
      cameraStream.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`Camera Control: Stopped track: ${track.kind}`);
      });
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        console.log("Camera Control: Video stream element srcObject cleared.");
      }
      cameraStream.current = null;
      console.log("Camera Control: Camera stopped successfully.");
    } else {
      console.log("Camera Control: No active camera stream to stop.");
    }
  };

  /**
   * Captures a single frame from the video element as a PNG ArrayBuffer.
   * @returns {Promise<ArrayBuffer|null>} The captured frame as an ArrayBuffer, or null if capture fails.
   */
  const captureSingleFrame = async () => {
    console.log("Frame Capture: Attempting to capture single frame.");
    if (!videoRef.current || !cameraStream.current || videoRef.current.readyState < 2) {
      setStatusMessage("Camera not ready or active. Cannot capture frame.");
      console.warn("Frame Capture: Video element or camera stream not ready.");
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");

    console.log(`Frame Capture: Drawing video frame to canvas (${canvas.width}x${canvas.height}).`);
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    try {
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      console.log(`Frame Capture: Captured Blob (type: ${blob.type}, size: ${blob.size} bytes).`);
      const arrayBuffer = await blob.arrayBuffer();
      console.log(`Frame Capture: Converted Blob to ArrayBuffer (${arrayBuffer.byteLength} bytes).`);
      return arrayBuffer;
    } catch (error) {
      console.error("Frame Capture: Error capturing single frame:", error);
      setStatusMessage(`Error capturing frame: ${error.message}`);
      return null;
    }
  };

  // --- Event Handlers ---

  // Handle time window button clicks for recognition
  const handleTimeWindowClick = async (timeKey) => {
    console.log("Event: Time window button clicked.");
    clearFullDisplay();
    toggleLoadingState(true);

    const timeWindow = timeWindows[timeKey];
    setTimeMarker(timeWindow);
    console.log(`Event: Selected time window: ${timeWindow}`);

    setStatusMessage("Capturing image...");
    const capturedFrameBuffer = await captureSingleFrame();

    if (!capturedFrameBuffer) {
      setStatusMessage("Failed to capture image for recognition. Please try again.");
      toggleLoadingState(false);
      console.error("Event: No frame captured, aborting recognition.");
      return;
    }

    const recognition_args = {
      timeWindow: timeWindow,
      timeOfRecognition: new Date().toISOString(), // Use ISO string for consistency
      imageData: capturedFrameBuffer, // Send the captured frame buffer
      rotateAngle: 0, // Assuming no rotation for recognition unless explicitly needed
    };
    console.log("Event: Sending recognition request to main process.");
    // Call the startRecognition function exposed by preload.js
    await window.electronAPI.startRecognition(recognition_args);
    // The onFaceStatus listener will handle real-time messages and turn off loading
    // based on the final status (success, fail, error) from main.js.
  };

  function updateCurrentTime() {
  // Get current UTC time and add 8 hours for GMT+8
  const now = new Date();
  // Convert to GMT+8 by adding 8 hours in milliseconds
  const gmt8 = new Date(
    now.getTime() + 8 * 60 * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000
  );
  // Format as HH:MM:SS
  const timeString = gmt8.toLocaleTimeString("en-PH", {
    hour12: false,
    timeZone: "Asia/Manila",
  });
//   currentTime.textContent = timeString;
}

  // --- Effects ---

  // Effect to update current time every second
  useEffect(() => {
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Effect to load application settings and start camera on mount
  useEffect(() => {
    const loadAppSettingsAndStartCamera = async () => {
      if (window.electronAPI && window.electronAPI.getAppSettings) {
        try {
          console.log("Initial Load: Fetching app settings for camera.");
          const settings = await window.electronAPI.getAppSettings();
          if (settings && settings.selectedCameraId) {
            setSelectedCameraId(settings.selectedCameraId);
            console.log("Initial Load: Loaded camera ID from settings:", settings.selectedCameraId);
            startCamera(settings.selectedCameraId); // Start camera with loaded settings
          } else {
            console.log("Initial Load: No specific camera ID found in settings, using default.");
            setSelectedCameraId("default");
            startCamera("default"); // Start camera with default
          }
        } catch (error) {
          console.error("Initial Load: Failed to load app settings for camera:", error);
          setStatusMessage(`Failed to load camera settings: ${error.message}`);
        }
      } else {
        console.warn("Initial Load: electronAPI.getAppSettings not available.");
        setStatusMessage("Electron API not available for settings. Cannot start camera.");
      }
    };
    loadAppSettingsAndStartCamera();

    // Clean up camera stream when component unmounts
    return () => {
      stopCamera();
    };
  }, []); // Empty dependency array means this runs once on mount

  // Effect to listen for real-time status updates from the main process
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onFaceStatus) {
      const handleFaceStatus = (response) => { // response is already parsed JSON from main.js
        console.log("IPC: Python/Backend response received:", response);

        if (response.status === "success" || response.status === "success_with_attendance_error") {
          console.log("IPC: Recognition successful.");
          setRecentUserName(response.data?.employeeName || 'N/A');
          setStatusMessage(response.message || "ID Success");
          setUserTimeStamp(new Date().toLocaleTimeString());
          setUserPosition(response.data?.employeePosition || "N/A"); // Use response.data for position

          // Display recognized face image if provided
          if (response.frame_base64) {
            setRecognizedFaceImage(`data:image/jpeg;base64,${response.frame_base64}`);
            setShowRecognizedImage(true);
            // Set timeout to clear image
            if (imageClearTimeoutId.current) {
              clearTimeout(imageClearTimeoutId.current);
            }
            imageClearTimeoutId.current = setTimeout(() => {
              setShowRecognizedImage(false);
              setRecognizedFaceImage('');
              console.log("IPC: Recognized image cleared after 4 seconds.");
            }, 4000);
          }
          toggleLoadingState(false);
        } else if (response.status === "fail") {
          console.warn("IPC: Recognition failed:", response.message);
          setStatusMessage(response.message || "Face not recognized.");
          setRecentUserName(response.message || "No known face recognized.");
          setUserTimeStamp("N/A");
          setUserPosition("Position");
          setShowRecognizedImage(false); // Ensure image is hidden on failure
          toggleLoadingState(false);
        } else if (response.status === "error") {
          console.error("IPC: System error:", response.message, response.details);
          showErrorMessages(
            "System Error",
            response.message || "An unexpected system error occurred."
          );
          setShowRecognizedImage(false); // Ensure image is hidden on error
          toggleLoadingState(false);
        } else if (response.status === "info") {
          console.log("IPC: Info message:", response.message);
          setStatusMessage(response.message || "Processing...");
          // Keep loading state active for info messages, unless it explicitly signals completion
          if (response.message && response.message.toLowerCase().includes("finished")) {
            toggleLoadingState(false);
          }
        } else {
          console.warn("IPC: Unexpected response format from backend:", response);
          showErrorMessages(
            "Unexpected System Response",
            response.message || "Received an unrecognized response format."
          );
          setShowRecognizedImage(false); // Ensure image is hidden
          toggleLoadingState(false);
        }
      };

      window.electronAPI.onFaceStatus(handleFaceStatus);

      // Cleanup listener on component unmount
      return () => {
        // Assuming removeFaceStatus is exposed by preload
        if (window.electronAPI.removeFaceStatus) {
            window.electronAPI.removeFaceStatus(handleFaceStatus);
        }
      };
    }
  }, []); // Empty dependency array means this runs once on mount

  // Hide main loading screen after a timeout (for initial app splash)
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
        src="/videos/ai-bg-blue.mp4" // Assuming path from public folder
        className="fixed w-full h-full object-cover -z-20"
        autoPlay
        muted
        loop
      />

      {/* Background Overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1c065490] via-[#1c06548c] to-[#00000090] -z-10"></div>

      {/* Title Bar */}
      <div className="w-full h-8 max-h-8 bg-transparent flex flex-row items-center justify-between px-2.5 select-none" style={{ WebkitAppRegion: 'drag' }}>
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

      {/* Home Button (using useNavigate for React Router) */}
      <button
        className="absolute top-10 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        onClick={() => navigate('/')} // Navigates to the root path (your unprotected Home page)
      >
        Home
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
            <div className="cameraInput h-full w-[59%] min-h-full flex flex-col items-center justify-center bg-black/30 rounded-lg relative overflow-hidden">
              {/* Live Video Stream */}
              <video
                ref={videoRef}
                id="videoStreamElement" // ID for the video element
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                style={{ transform: "scaleX(-1)" }} // Mirror effect for webcam
              />

              {showInstruction && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-center text-lg p-4">
                  Move in front of the camera and select a time window.
                </div>
              )}

              {/* Recognized Face Image Overlay */}
              {showRecognizedImage && (
                <img
                  src={recognizedFaceImage}
                  className="absolute inset-0 w-full h-full object-cover rounded-[5%] z-10" // Overlay on top
                  alt="Recognized Face"
                />
              )}

              {/* Loading Spinner Overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-[5%] z-20">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white ml-4 text-lg">Processing...</p>
                </div>
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
              <div className="grid grid-cols-4 gap-2">
                <button
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-green-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                  onClick={() => handleTimeWindowClick('morningTimeIn')}
                >
                  AM IN
                </button>
                <button
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-green-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                  onClick={() => handleTimeWindowClick('morningTimeOut')}
                >
                  AM OUT
                </button>
                <button
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-yellow-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
                  onClick={() => handleTimeWindowClick('afternoonTimeIn')}
                >
                  PM IN
                </button>
                <button
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-yellow-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
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
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            onClick={() => navigate('/attendance')} // Use navigate for internal routing
          >
            View Logs
          </button>
        </div>
      </div>
    </>
  );
};

export default Recognize;