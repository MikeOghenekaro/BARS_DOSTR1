import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { APP_URL } from '@/lib/constants';

const ViewAttendance = () => {
  const [errorScreen, setErrorScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorHeader, setErrorHeader] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

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

  // Update current time
  const updateCurrentTime = () => {
    const now = new Date();
    const gmt8 = new Date(
      now.getTime() + (8 + now.getTimezoneOffset() / 60) * 60 * 60 * 1000
    );
    const timeString = gmt8.toLocaleTimeString("en-PH", {
      hour12: false,
      timeZone: "Asia/Manila",
    });
    setCurrentTime(timeString);
  };

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/attendance");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === "success") {
        setAttendanceRecords(data.records);
      } else {
        console.error("Failed to fetch attendance records: ", data.message);
        showErrorMessages("Attendance Fetch Error", data.message);
        setAttendanceRecords([]);
      }
    } catch (error) {
      showErrorMessages("Attendance Fetch Error", error.message);
      setAttendanceRecords([]);
    }
  };

  // Fetch employee data
  const getEmployeeId = async () => {
    try {
      console.log("Fetching employee data");
      const response = await fetch("http://localhost:5000/api/employee");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success" && Array.isArray(data.employees)) {
        console.log("Employees: ", data.employees);
        setEmployees(data.employees);
      }
    } catch (error) {
      showErrorMessages("Employee fetch error", error.message);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return new Date(timeString).toLocaleTimeString();
  };

  // Initialize component
  useEffect(() => {
    console.log("App is loaded");
    
    // Fetch attendance records on page load
    fetchAttendanceRecords();
    
    // Fetch employee data
    getEmployeeId();
    
    // Set up time updates
    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Background Video */}
      <video 
        src="/videos/ai-bg-blue.mp4"
        className="fixed w-full h-full object-cover -z-99"
        autoPlay 
        muted 
        loop
      />

      {/* Background Overlay */}
      {/* <div className="fixed inset-0 bg-gradient-radial from-[#1c065490] via-[#1c06548c] to-[#00000090] z-6"></div> */}

      {/* Title Bar */}
      <div className="w-full h-8 max-h-8 bg-transparent flex flex-row items-center justify-between px-2.5 select-none z-10" style={{ WebkitRegionDrag: 'drag' }}>
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

      {/* Header */}
      <div className="flex flex-col items-start justify-center pl-[1%] w-full h-24 z-10">
        <p className="text-center text-[3.5rem] text-[#e7e5ec]">BARS</p>
        <p className="text-center text-base text-[#e7e5ec]">Biometric Attendance Records System</p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-start min-h-screen bg-transparent px-4 z-10">
        {/* Live Clock */}
        <div className="text-white text-3xl font-bold text-center mb-8">
          {currentTime}
        </div>

        {/* Attendance Table */}
        <div className="w-full max-w-6xl bg-black/30 rounded-lg p-6 mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">AM In</th>
                  <th className="px-4 py-3 text-left font-semibold">AM Out</th>
                  <th className="px-4 py-3 text-left font-semibold">PM In</th>
                  <th className="px-4 py-3 text-left font-semibold">PM Out</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">{record.employee}</td>
                      <td className="px-4 py-3">{formatTime(record.checkInAm)}</td>
                      <td className="px-4 py-3">{formatTime(record.checkOutAm)}</td>
                      <td className="px-4 py-3">{formatTime(record.checkInPm)}</td>
                      <td className="px-4 py-3">{formatTime(record.checkOutPm)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          record.status === 'Present' ? 'bg-green-600 text-white' :
                          record.status === 'Absent' ? 'bg-red-600 text-white' :
                          record.status === 'Late' ? 'bg-yellow-600 text-black' :
                          'bg-gray-600 text-white'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDate(record.date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Return Button */}
        <button 
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 mb-8"
        onClick={()=> navigate('/recognize')}
        >
          Return
        </button>
      </div>
    </>
  );
};

export default ViewAttendance; 