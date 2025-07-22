import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Notification from '../components/ui/Notification'; // Assuming this path is correct for your project structure

const Recognize = () => {
  // State for UI elements and data
  const [loadingScreen, setLoadingScreen] = useState(false); // For the main app loading overlay
  const [errorScreen, setErrorScreen] = useState(false); // This will be phased out for notifications
  const [errorMessage, setErrorMessage] = useState(''); // This will be phased out for notifications
  const [errorHeader, setErrorHeader] = useState(''); // This will be phased out for notifications
  const [currentTime, setCurrentTime] = useState('');
  // statusMessage will now be used internally to pass to the Notification component
  const [statusMessage, setStatusMessage] = useState('Camera initializing...'); 
  
  // These states are directly for the UI display fields
  const [recentEmployeeName, setRecentEmployeeName] = useState('Welcome');
  const [timeMarker, setTimeMarker] = useState('DOST-R1'); // This is the Time Window field
  const [employeePosition, setEmployeePosition] = useState('');
  const [employeeTimeStamp, setEmployeeTimeStamp] = useState('');
  
  const [recognizedFaceImage, setRecognizedFaceImage] = useState('');
  const [showRecognizedImage, setShowRecognizedImage] = useState(false); // Controls visibility of captured image
  const [isLoading, setIsLoading] = useState(false); // Controls the spinner and instruction message
  const [showInstruction, setShowInstruction] = useState(true);

  // New state for managing notifications
  const [notifications, setNotifications] = useState([]);
  const notificationTimeoutIds = useRef({}); // To store timeout IDs for each notification

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
    afternoonTimeOut: "PM In", // Corrected from PM Out to PM In as per common patterns
    afternoonTimeOutActual: "PM Out", // Added a distinct PM Out if needed
  };
  

  // Helper to add a notification to the queue
  const addNotification = (message, type, details = null) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9); // Unique ID for the notification
    const newNotification = { id, text: message, type, details };

    setNotifications((prevNotifications) => {
      // Append new notification to show it as the most recent one
      return [...prevNotifications, newNotification];
    });

    // Set a timeout to remove the notification after 3 seconds
    notificationTimeoutIds.current[id] = setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  // Helper to remove a notification from the queue
  const removeNotification = (id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((n) => n.id !== id)
    );
    if (notificationTimeoutIds.current[id]) {
      clearTimeout(notificationTimeoutIds.current[id]);
      delete notificationTimeoutIds.current[id];
    }
  };

  // --- UI State Management Functions ---
  const showLoadingScreen = () => setLoadingScreen(true);
  const hideLoadingScreen = () => setLoadingScreen(false);

  // Removed showErrorMessages and closeErrorScreen as they are replaced by Notification

  const toggleLoadingState = (isLoading) => {
    setIsLoading(isLoading);
    setShowInstruction(!isLoading); // Hide instructions when loading/processing
  };

  const clearFullDisplay = () => {
    setRecentEmployeeName('Welcome'); // Reset to initial state
    // setStatusMessage(''); // Status messages now handled by Notification
    setEmployeePosition(''); // Reset to initial state
    setEmployeeTimeStamp(''); // Reset to initial state
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
      window.electronAPI.closeWIndow(); // Use windowClose as per main.js
    }
  };

  const handleMinimizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow(); // Use windowMinimize as per main.js
    }
  };

  /**
   * Starts the camera stream using the specified deviceId or the default.
   * Includes robust error handling for OverconstrainedError.
   * @param {string|null} deviceIdToUse - The deviceId of the camera to use, or null/undefined for default.
   */
  const startCamera = async (deviceIdToUse) => {
    // console.log(`Camera Control: Attempting to start camera with ID: ${deviceIdToUse}`);
    stopCamera(); // Ensure any existing stream is stopped
    // addNotification("Initializing camera...", "info"); // Use notification

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addNotification("getUserMedia is not supported by this browser. Cannot access camera.", "error"); // Use notification
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
      addNotification("Camera active. Position your face.", "info"); // Use notification
      console.log("Camera Control: Camera started successfully.");
    } catch (err) {
      console.error("Camera Control: Error accessing camera on first attempt:", err);
      if (err.name === "OverconstrainedError") {
        addNotification(
          "Selected camera not found or busy. Attempting to use default camera...",
          "warning" // Use warning for retry attempts
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
          addNotification("Camera active (using default). Position your face.", "info"); // Use notification
          console.log("Camera Control: Camera started successfully with default camera.");
        } catch (retryErr) {
          console.error("Camera Control: Retry with generic constraints failed:", retryErr);
          addNotification(`Camera access failed: ${retryErr.message}. No camera available.`, "error"); // Use notification
        }

      } else if (err.name === "NotFoundError" || err.name === "SourceUnavailableError") {
        addNotification(
          "Camera not found or unavailable. Please check connections or settings.",
          "error" // Use error for definitive failures
        );
        console.error("Camera Control: Camera not found or unavailable.");
      } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        addNotification(
          "Camera access denied. Please grant permission in your system settings.",
          "error" // Use error
        );
        console.error("Camera Control: Camera access denied by user/system.");
      } else {
        addNotification(`Camera access failed: ${err.message}`, "error"); // Use error
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
      addNotification("Camera not ready or active. Cannot capture frame.", "warning"); // Use notification
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
      addNotification(`Error capturing frame: ${error.message}`, "error"); // Use notification
      return null;
    }
  };

  // --- Event Handlers ---

  // Handle time window button clicks for recognition
  const handleTimeWindowClick = async (timeKey) => {
    console.log("Event: Time window button clicked.");
    clearFullDisplay(); // Reset display fields
    toggleLoadingState(true);

    const timeWindow = timeWindows[timeKey];
    setTimeMarker(timeWindow); // Set the time window in the UI field
    console.log(`Event: Selected time window: ${timeWindow}`);

    addNotification("Capturing image...", "info"); // Use notification
    const capturedFrameBuffer = await captureSingleFrame();

    if (!capturedFrameBuffer) {
      addNotification("Failed to capture image for recognition. Please try again.", "fail"); // Use notification
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
    setCurrentTime(timeString); // Update currentTime state
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
          addNotification(`Failed to load camera settings: ${error.message}`, "error"); // Use notification
        }
      } else {
        console.warn("Initial Load: electronAPI.getAppSettings not available.");
        addNotification("Electron API not available for settings. Cannot start camera.", "error"); // Use notification
      }
    };
    loadAppSettingsAndStartCamera();

    // Clean up camera stream when component unmounts
    return () => {
      stopCamera();
      // Clear any pending image clear timeout on unmount
      if (imageClearTimeoutId.current) {
        clearTimeout(imageClearTimeoutId.current);
      }
      // Clear all notification timeouts on unmount
      for (const id in notificationTimeoutIds.current) {
        clearTimeout(notificationTimeoutIds.current[id]);
      }
      notificationTimeoutIds.current = {};
    };
  }, []);

  // Effect to listen for real-time status updates from the main process
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onFaceStatus) {
      const handleFaceStatus = (response) => {
        console.log("IPC: Python/Backend response received:", response);

        if (response.status === "success" || response.status === "success_with_attendance_error") {
          console.log("IPC: Recognition successful.");
          console.log("Response: ", response);
          setRecentEmployeeName(
            response.data?.employeeName
            // "There was no name seemingly"
          );
          setEmployeeTimeStamp(new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: "Asia/Manila" })); // Format timestamp
          setEmployeePosition(response.data?.employeePosition);
          

          addNotification(response.message || "ID Success", 'success');

          // Display recognized face image if provided
          if (response.frame_base64) {
            setRecognizedFaceImage(`data:image/jpeg;base64,${response.frame_base64}`);
            setShowRecognizedImage(true);
            if (imageClearTimeoutId.current) {
              clearTimeout(imageClearTimeoutId.current);
            }
            imageClearTimeoutId.current = setTimeout(() => {
              setShowRecognizedImage(false);
              setRecognizedFaceImage('');
              console.log("IPC: Recognized image cleared after 6 seconds.");
            }, 6000);
          }
          toggleLoadingState(false);
        } else if (response.status === "fail") {
          console.warn("IPC: Recognition failed:", response.message);
          setRecentEmployeeName("Unidentified Employee"); // As requested
          setEmployeeTimeStamp(""); // Clear timestamp on failure
          setEmployeePosition(""); // Clear position to N/A on failure
          // timeMarker remains unchanged.

          addNotification(response.message || "Face not recognized.", 'fail');

          setShowRecognizedImage(false); // Ensure image is hidden on failure
          toggleLoadingState(false);
        } else if (response.status === "error") {
          console.error("IPC: System error:", response.message, response.details);
          // Do NOT clear or modify recentEmployeeName, employeeTimeStamp, employeePosition on error
          addNotification(
            response.message || "An unexpected system error occurred.",
            'error',
            response.details
          );
          setShowRecognizedImage(false); // Ensure image is hidden on error
          toggleLoadingState(false);
        } else if (response.status === "info") {
          console.log("IPC: Info message:", response.message);
          // Do NOT clear or modify recentEmployeeName, employeeTimeStamp, employeePosition on info
          addNotification(response.message || "Processing...", 'info');
          // Keep loading state active for info messages, unless it explicitly signals completion
          if (response.message && response.message.toLowerCase().includes("finished")) {
            toggleLoadingState(false);
          }
        } else {
          console.warn("IPC: Unexpected response format from backend:", response);
          // Do NOT clear or modify recentEmployeeName, employeeTimeStamp, employeePosition on unexpected status
          addNotification(
            response.message || "Received an unrecognized response format.",
            'error'
          );
          setShowRecognizedImage(false); // Ensure image is hidden
          toggleLoadingState(false);
        }
      };

      window.electronAPI.onFaceStatus(handleFaceStatus);

      // Cleanup listener on component unmount
      return () => {
        if (window.electronAPI.removeFaceStatus) {
            window.electronAPI.removeFaceStatus(handleFaceStatus);
        }
      };
    }
  }, []);

  // Hide main loading screen after a timeout (for initial app splash)
  useEffect(() => {
    hideLoadingScreen();
  }, []);

  return (
    <>
      {/* Prevent all scrolling on the page */}
      <style>{`
        html, body, #root {
          overflow: hidden !important;
          height: 100%;
        }
      `}</style>
      <div className="">
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

        {/* Home Button (using useNavigate for React Router) */}
        <button
          className="absolute top-10 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          onClick={() => navigate('/')} // Navigates to the root path (your unprotected Home page)
        >
          Home
        </button>


        {/* Notification Component */}
        <Notification messages={notifications} onClose={removeNotification} />

        {/* Main Container */}
        <div className="m-0 p-0 w-full flex flex-col items-center justify-center bg-transparent" style={{ height: 'calc(100vh - 30px)' }}>
          <div className="mt-5 h-[70%] w-full flex flex-row justify-center bg-transparent">
            <div className="flex flex-row items-center justify-around h-full w-full bg-transparent mb-6">
              {/* Camera Input Section */}
              <div className="cameraInput h-full w-[59%] min-h-full flex flex-col items-center justify-center bg-black/30 rounded-lg relative overflow-hidden">
                {/* Live Video Stream */}
                <video
                  ref={videoRef}
                  id="videoStreamElement"
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                  style={{ transform: "scaleX(-1)" }} // Mirror effect for webcam
                />

                {showInstruction && (
                  <div className="absolute inset-0 flex items-center justify-center bg-transparent bg-opacity-50 text-white text-center text-lg p-4">
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
                  {/* Removed statusMessage display from here */}
                  {/* <div className="text-center text-lg mb-2">{statusMessage}</div> */}
                  <div className="text-center flex flex-row justify-between">
                    <h3 className="text-xl font-bold">{recentEmployeeName}</h3>
                    <h3 className="text-lg">{timeMarker}</h3> {/* This is the Time Window */}
                  </div>
                  <div className="text-center mt-2 flex flex-row justify-between">
                    <p>{employeePosition}</p>
                    <p>{employeeTimeStamp}</p>
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
                    onClick={() => handleTimeWindowClick('afternoonTimeOutActual')}
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
      </div>
    </>
  );
};

export default Recognize;