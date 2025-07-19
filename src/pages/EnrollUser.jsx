/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useState, useEffect } from "react";
import path from "path"; // Import path for file handling


const EnrollUser = () => {
  const videoRef = useRef(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState(""); // Added state for employee name
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // Controls the spinner and button state
  const [videoInput, setVideoInput] = useState("0"); // '0' for webcam, 'file' for video file
  const [videoFilePath, setVideoFilePath] = useState(""); // Path for selected video file
  const [videoFile, setVideoFile] = useState(null); // File object for selected video file
  let cameraStream = useRef(null); // Reference to the camera MediaStream object


  // New state to store the camera ID from application settings
  const [selectedCameraIdFromSettings, setSelectedCameraIdFromSettings] =
    useState("default");


  const EMPLOYEE_API_URL = "http://localhost:5000/api/employee"; // Ensure this is correct for your backend


  // --- Effect to fetch employee list on component mount ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(EMPLOYEE_API_URL);
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.employees)) {
          setEmployeeList(data.employees);
          if (data.employees.length > 0) {
            // Set initial employeeId and name to the first employee in the list
            const firstEmployee = data.employees[0];
            setEmployeeId(firstEmployee.id);
            setEmployeeName(
              `${firstEmployee.firstName} ${firstEmployee.middleName || ""} ${
                firstEmployee.lastName
              }`
            );
          }
        }
      } catch (err) {
        setMessage(`Failed to fetch employee list: ${err.message}`);
      }
    };
    fetchEmployees();
  }, []); // Empty dependency array means this runs once on mount


  // --- Effect to load application settings (including selected camera) ---
  useEffect(() => {
    const loadAppSettings = async () => {
      try {
        // Fetch app settings from the main Electron process
        const settings = await window.electronAPI.getAppSettings();
        if (settings && settings.selectedCameraId) {
          setSelectedCameraIdFromSettings(settings.selectedCameraId);
          console.log(
            "Loaded camera ID from settings:",
            settings.selectedCameraId
          );
        } else {
          console.log(
            "No specific camera ID found in settings, using default."
          );
          setSelectedCameraIdFromSettings("default"); // Fallback to default
        }
      } catch (error) {
        console.error("Failed to load app settings for camera:", error);
        setMessage(`Failed to load camera settings: ${error.message}`);
      }
    };
    loadAppSettings();
  }, []); // Runs once on mount to get settings


  // --- Effect to listen for real-time status updates from the main process ---
  useEffect(() => {
    const handleFaceStatus = (statusJson) => {
      // Parse status JSON if it's a string, otherwise use directly
      const status =
        typeof statusJson === "string" ? JSON.parse(statusJson) : statusJson;
      setMessage(status.message); // Display message to the user
      // If the status indicates a final state (success, fail, error), turn off loading
      if (
        status.status === "success" ||
        status.status === "fail" ||
        status.status === "error"
      ) {
        setLoading(false);
      }
    };


    // Ensure window.electronAPI and onFaceStatus exist before adding listener
    if (window.electronAPI && window.electronAPI.onFaceStatus) {
      window.electronAPI.onFaceStatus(handleFaceStatus);
    } else {
      console.warn("Electron API for face status not available.");
    }


    // No explicit cleanup for onFaceStatus as it might be a global listener
    // If memory leaks occur, consider implementing `removeFaceStatusListener` in preload/main.
  }, []);


  // --- Effect to update employee name when employeeId changes ---
  useEffect(() => {
    const selectedEmployee = employeeList.find((emp) => emp.id === employeeId);
    if (selectedEmployee) {
      setEmployeeName(
        `${selectedEmployee.firstName} ${selectedEmployee.middleName || ""} ${
          selectedEmployee.lastName
        }`
      );
    }
  }, [employeeId, employeeList]);


  // --- Effect to start/stop camera based on videoInput and selectedCameraIdFromSettings ---
  useEffect(() => {
    if (videoInput === "0") {
      // If webcam is selected, start the camera using the configured device ID
      startCamera(selectedCameraIdFromSettings);
    } else {
      // If file input is selected, ensure camera is off
      stopCamera();
    }
  }, [videoInput, selectedCameraIdFromSettings]); // Re-run when videoInput or selectedCameraIdFromSettings changes


  // --- Camera Control Functions ---


  /**
   * Starts the camera stream using the specified deviceId or the default.
   * @param {string|null} deviceId - The deviceId of the camera to use, or null for default.
   */
  const startCamera = async (deviceId) => {
    stopCamera(); // Stop any existing stream first
    setMessage(""); // Clear previous messages


    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage("getUserMedia is not supported by this browser.");
      return;
    }


    try {
      // Define video constraints: use exact deviceId if provided, otherwise true for any video device
      const constraints = {
        video:
          deviceId && deviceId !== "default"
            ? { deviceId: { exact: deviceId } }
            : true,
      };
      console.log("Attempting to start camera with constraints:", constraints);


      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStream.current = stream; // Store the stream reference
      if (videoRef.current) {
        videoRef.current.srcObject = stream; // Assign stream to video element
        videoRef.current.play(); // Play the video
      }
      setIsCameraOn(true); // Update camera status
      setMessage("Camera started.");
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (
        err.name === "NotFoundError" ||
        err.name === "SourceUnavailableError"
      ) {
        setMessage(
          "Camera not found or unavailable. Please check connections or settings."
        );
      } else if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setMessage(
          "Camera access denied. Please grant permission in your system settings."
        );
      } else {
        setMessage(`Camera access failed: ${err.message}`);
      }
      setIsCameraOn(false); // Update camera status
    }
  };


  /**
   * Stops the current camera stream.
   */
  const stopCamera = () => {
    if (cameraStream.current) {
      // Stop all tracks in the stream (video, audio)
      cameraStream.current.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Disconnect stream from video element
      }
      cameraStream.current = null; // Clear stream reference
      setIsCameraOn(false); // Update camera status
      console.log("Camera stopped.");
    }
  };


  // --- Event Handlers ---


  /**
   * Handles change in video input source (Webcam vs. Video File).
   * @param {Event} e - The change event from the select element.
   */
  const handleVideoInputChange = (e) => {
    const newVideoInput = e.target.value;
    setVideoInput(newVideoInput); // Update video input state
    setMessage(""); // Clear messages


    if (newVideoInput === "file") {
      stopCamera(); // Stop camera if switching to file input
      setVideoFile(null); // Clear previous file selection
      setVideoFilePath(""); // Clear previous file path
      if (videoRef.current) {
        videoRef.current.src = ""; // Clear video element source
      }
    } else {
      setVideoFile(null); // Clear file states if switching to webcam
      setVideoFilePath("");
      // Camera will be started by the useEffect hook watching `videoInput`
    }
  };


  /**
   * Handles file selection via Electron dialog.
   * @param {Event} e - The click event from the button (optional).
   */
  const handleFileSelect = async (e) => {
    if (e) e.preventDefault(); // Prevent form submission if called from a button
    setVideoInput("file"); // Ensure input source is set to 'file'
    setMessage("Please select a video file..."); // Inform user


    // Call Electron API to open file dialog
    const filePath = await window.electronAPI.selectFile();
    if (filePath) {
      setVideoFilePath(filePath); // Store selected file path
      setMessage(`Selected file: ${path.basename(filePath)}`); // Display just the filename
      stopCamera(); // Stop camera if it was on


      // Read file content as Blob from preload/main process
      const fileBlob = await window.electronAPI.readFileAsBlob(filePath);
      if (fileBlob) {
        const url = URL.createObjectURL(fileBlob); // Create URL for video element
        if (videoRef.current) {
          videoRef.current.src = url; // Set video source
          videoRef.current.play(); // Play the video file
        }
        setIsCameraOn(false); // Camera is not on, a file is playing
      } else {
        setMessage("Failed to read selected file.");
        setVideoFilePath(""); // Clear path if read failed
        setVideoFile(null);
      }
    } else {
      setMessage("File selection cancelled.");
      // If user cancels, revert to webcam if it was the previous state, or just clear file path
      if (videoInput === "0") {
        startCamera(selectedCameraIdFromSettings); // Restart camera if it was the previous mode
      }
      setVideoFilePath("");
      setVideoFile(null);
    }
  };


  /**
   * Handles the enrollment process submission.
   * @param {Event} e - The form submission event.
   */
  const handleEnroll = async (e) => {
    e.preventDefault(); // Prevents form from reloading the page
    setMessage(""); // Clear previous messages


    // Basic validation
    if (!employeeId) {
      setMessage("Please select an employee.");
      return;
    }
    if (videoInput === "file" && !videoFilePath) {
      setMessage("Please select a video or image file.");
      return;
    }


    // If webcam is selected, stop the camera before Python accesses it
    if (videoInput === "0") {
      console.log("Closing camera for enrollment process...");
      stopCamera();
    }


    setLoading(true); // Activate loading state (spinner appears)
    setMessage("Initiating enrollment process..."); // Inform user


    try {
      // Introduce a 3-second delay after camera stops/file is ready
      console.log("Waiting 3 seconds before triggering Python enrollment...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 3-second delay


      // Prepare the data payload for the main process
      const dataPayload = {
        employeeId: employeeId,
        inputSource: videoInput === "file" ? videoFilePath : "0", // Pass '0' for webcam, or file path
      };


      console.warn("Payload ready for enrollment:", dataPayload);
      // Call the startEnrollment function exposed by preload.js
      const result = await window.electronAPI.startEnrollment(dataPayload);


      // The onFaceStatus listener will handle real-time messages and turn off loading
      // based on the final status (success, fail, error) from main.js.
      // So, no need to set message or loading here based on 'result'.
      // The `result` here is what `main.js` returns from its `ipcMain.handle`,
      // which is typically the final status.
      if (
        result &&
        (result.status === "success" ||
          result.status === "fail" ||
          result.status === "error")
      ) {
        // Message and loading state will be updated by the onFaceStatus listener
      } else {
        // Fallback for unexpected result structure from startEnrollment IPC
        setMessage(`Enrollment process completed with unknown status.`);
        setLoading(false); // Ensure loading is turned off
      }
    } catch (err) {
      setMessage(`Failed to initiate enrollment: ${err.message}`);
      console.error(`Failed to initiate enrollment: ${err.message}`);
      setLoading(false); // Ensure loading is turned off on immediate error
    }
  };


  return (
    <div className="flex flex-col bg-white-low h-full p-4">
      <div className="biometric-info h-full w-full flex flex-row">
        <div className="camera-input flex flex-col items-center justify-center h-full w-full flex-1 relative">
          {" "}
          {/* Added relative positioning */}
          <div className="h-[70%] w-[90%] rounded-[5%] bg-[#00000022] overflow-hidden">
            {" "}
            {/* Added overflow-hidden */}
            <video
              ref={videoRef}
              id="camStream"
              className="w-full h-full rounded-[16px] object-cover"
              autoPlay
              playsInline // Important for mobile browsers
              muted // Mute video to prevent audio issues
              style={{ transform: "scaleX(-1)" }} // Mirror effect for webcam
            />
            {loading && ( // Conditional rendering for the spinner overlay
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-[16px] z-10">
                <div className="border-4 border-gray-200 border-l-[#0084ff] rounded-full w-12 h-12 animate-spin"></div>
                <p className="text-white ml-4 text-lg">Processing...</p>
              </div>
            )}
          </div>
        </div>
        {/* Adjusted positioning for message. Use a more robust message display system if needed. */}
        <h2 className="text-[#FFBF00] text-bold absolute top-4 left-4 z-20">
          {message}
        </h2>
        <div className="input-form flex flex-col items-center justify-center flex-1 p-2">
          <form
            id="enroll-form"
            onSubmit={handleEnroll}
            className="w-full max-w-sm"
          >
            {" "}
            {/* Added w-full max-w-sm for better form sizing */}
            <label
              htmlFor="employee-id-input"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Select Employee
            </label>
            <select
              name="employee-id-input"
              id="employee-id-input"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-blue-500 p-0.5 rounded-[8px]"
              style={{ marginBottom: 12 }}
            >
              {employeeList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.id} - {emp.firstName} {emp.middleName || ""}{" "}
                  {emp.lastName}
                </option>
              ))}
            </select>
            <label
              htmlFor="videoInput"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Select Input
            </label>
            <select
              id="videoInput"
              name="videoInput"
              value={videoInput}
              onChange={handleVideoInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-blue-500 p-0.5 rounded-[8px]"
              style={{ marginBottom: 12 }}
            >
              <option value="0">Webcam</option>
              <option value="file">Video File</option>
            </select>
            {videoInput === "file" && (
              <button
                type="button"
                onClick={handleFileSelect}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center w-full justify-center"
              >
                Select Video File
              </button>
            )}
            <button
              id="enroll-btn"
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full"
              disabled={loading}
            >
              {loading ? "Enrolling..." : "Enroll"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


export default EnrollUser;



