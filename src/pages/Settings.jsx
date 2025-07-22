
import React, { useState, useEffect, useRef } from "react";

export default function Settings() {
  // State for available camera devices and the selected one
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("default"); // 'default' or a deviceId

  // State for local data storage path
  const [localDataPath, setLocalDataPath] = useState("");

  // State for database name (a configurable string, not actual DB connection)
  const [dbName, setDbName] = useState("");

  // State for user feedback messages (success/error)
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'

  // State for loading indicator during async operations
  const [loading, setLoading] = useState(false);

  // Ref for the video element to display camera stream
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null); // To keep track of the active camera stream

  // --- Effect to load initial settings and camera devices ---
  useEffect(() => {
    const loadInitialSettings = async () => {
      setLoading(true);
      setMessage("");
      try {
        // Fetch current settings from the main process
        const settings = await window.electronAPI.getAppSettings();
        if (settings) {
          setSelectedCameraId(settings.selectedCameraId || "default");
          setLocalDataPath(settings.localDataPath || "");
          setDbName(settings.dbName || "");
        } else {
          setMessage("No settings found, using defaults.");
          setMessageType("info");
        }

        // Enumerate available media devices (cameras) directly in the renderer
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputDevices = devices.filter(
            (device) => device.kind === "videoinput"
          );
          setCameraDevices(videoInputDevices);

          // If a camera was previously selected, try to start its stream
          if (settings.selectedCameraId && videoInputDevices.some(d => d.deviceId === settings.selectedCameraId)) {
            startCamera(settings.selectedCameraId);
          } else if (videoInputDevices.length > 0) {
            // If no specific camera was saved, or it's no longer available, use the first one
            setSelectedCameraId(videoInputDevices[0].deviceId);
            startCamera(videoInputDevices[0].deviceId);
          } else {
            setMessage("No camera devices found.");
            setMessageType("error");
          }
        }
      } catch (error) {
        console.error("Failed to load settings or camera devices:", error);
        setMessage(`Failed to load settings: ${error.message}`);
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    loadInitialSettings();

    // Cleanup function: stop camera stream when component unmounts
    return () => {
      stopCamera();
    };
  }, []); // Run once on mount

  // --- Effect to restart camera when selectedCameraId changes ---
  useEffect(() => {
    if (selectedCameraId && selectedCameraId !== "default" && cameraDevices.length > 0) {
      startCamera(selectedCameraId);
    } else if (selectedCameraId === "default" && cameraDevices.length > 0) {
      // If 'default' is selected, try to start with no specific deviceId
      startCamera(null);
    } else {
      stopCamera(); // Stop camera if no valid ID or no devices
    }
  }, [selectedCameraId, cameraDevices]);


  // --- Camera Control Functions ---
  const startCamera = async (deviceId) => {
    stopCamera(); // Stop any existing stream first
    setMessage(""); // Clear previous messages
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setMessage(`Camera access failed: ${err.message}`);
      setMessageType("error");
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      cameraStreamRef.current = null;
    }
  };

  // --- Event Handlers ---

  const handleCameraChange = (e) => {
    setSelectedCameraId(e.target.value);
  };

  const handleSelectLocalDataPath = async () => {
    setMessage("");
    setLoading(true);
    try {
      const result = await window.electronAPI.selectDirectory();
      if (result) {
        setLocalDataPath(result);
        setMessage("Local data path selected.");
        setMessageType("success");
      } else {
        setMessage("Local data path selection cancelled.");
        setMessageType("info");
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
      setMessage(`Failed to select local data path: ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDbNameChange = (e) => {
    setDbName(e.target.value);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage("");
    try {
      const settingsToSave = {
        selectedCameraId,
        localDataPath,
        dbName,
      };
      await window.electronAPI.saveAppSettings(settingsToSave);
      setMessage("Settings saved successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage(`Failed to save settings: ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-[#eeeeee] min-h-screen font-sans text-[#111111] overflow-y-auto">
      <h1 className="text-4xl font-bold mb-6 text-[#001325]">
        Application Settings
      </h1>

      {loading && (
        <div className="text-center my-4">
          <div className="border-4 border-gray-200 border-l-[#0084ff] rounded-full w-8 h-8 animate-spin mx-auto"></div>
          <p className="text-[#111111] mt-2">Loading...</p>
        </div>
      )}

      {message && (
        <div
          className={`p-3 mb-4 rounded-lg text-center ${
            messageType === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-md mb-6">
        <h2 className="text-xl font-bold text-[#001325] mb-4">Camera Settings</h2>
        <div className="mb-4">
          <label htmlFor="camera-select" className="block text-gray-700 text-sm font-bold mb-2">
            Select Camera Device:
          </label>
          <select
            id="camera-select"
            value={selectedCameraId}
            onChange={handleCameraChange}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={loading || cameraDevices.length === 0}
          >
            {cameraDevices.length === 0 ? (
              <option value="no-devices">No camera devices found</option>
            ) : (
              <>
                <option value="default">Default Camera</option>
                {cameraDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.substring(0, 8)}...`}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
        <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover transform scaleX(-1)" // Mirror effect for webcam
            autoPlay
            playsInline
            muted
          ></video>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md mb-6">
        <h2 className="text-xl font-bold text-[#001325] mb-4">Local Data Storage</h2>
        <div className="mb-4">
          <label htmlFor="local-data-path" className="block text-gray-700 text-sm font-bold mb-2">
            Local Data Folder:
          </label>
          <input
            type="text"
            id="local-data-path"
            value={localDataPath}
            readOnly
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100 cursor-not-allowed"
          />
        </div>
        <button
          onClick={handleSelectLocalDataPath}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          disabled={loading}
        >
          Browse Folder
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md mb-6">
        <h2 className="text-xl font-bold text-[#001325] mb-4">Database Settings</h2>
        <div className="mb-4">
          <label htmlFor="db-name" className="block text-gray-700 text-sm font-bold mb-2">
            Database Name (Label):
          </label>
          <input
            type="text"
            id="db-name"
            value={dbName}
            onChange={handleDbNameChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="e.g., BARS_Production_DB"
            disabled={loading}
          />
          <p className="text-gray-500 text-xs mt-1">
            This is a label for your reference; it does not directly change the backend database connection.
          </p>
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out w-full sm:w-auto"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
