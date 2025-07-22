import React, { useState, useEffect } from "react";
import { APP_URL } from "@/lib/constants";

// Define the API base URL based on your Electron app's port
const API_BASE_URL = `${APP_URL}/api`;

// Simple Spinner Component (using Tailwind classes)
const Spinner = () => (
  <div className="border-4 border-gray-200 border-l-[#0084ff] rounded-full w-8 h-8 animate-spin mx-auto my-5"></div>
);

// Helper to format date/time
const formatTime = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  // Format to local time (e.g., 08:30 AM/PM)
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Helper to determine record status for display
const getAttendanceStatus = (record) => {
  if (
    record.checkInAm &&
    record.checkOutAm &&
    record.checkInPm &&
    record.checkOutPm
  ) {
    return { text: "Full Day", colorClass: "bg-green-100 text-green-800" };
  } else if (record.checkInAm || record.checkInPm) {
    // If any check-in exists, but not all check-outs, employee is 'Clocked In'
    return { text: "Clocked In", colorClass: "bg-blue-100 text-[#0084ff]" };
  } else if (record.status === "Absent") {
    return { text: "Absent", colorClass: "bg-red-100 text-red-800" };
  }
  // Default status if only 'date' is present or no specific status
  return { text: "No Activity", colorClass: "bg-gray-100 text-gray-600" };
};

export default function ViewLogs() {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/attendance`);
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} from /api/attendance`
          );
        }
        const data = await response.json();
        const records = data.records || [];

        // Get current date in Philippine local time (PST) for accurate 'today' comparison
        const now = new Date();
        const todayPST = now.toLocaleDateString("en-CA", {
          // 'en-CA' for YYYY-MM-DD format
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: "Asia/Manila", // Philippine Standard Time
        });

        // Filter records for today only
        const todayLogs = records.filter((record) => {
          const recordDateUTC = new Date(record.date); // This is interpreted as UTC
          const recordDatePST = recordDateUTC.toLocaleDateString("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            timeZone: "Asia/Manila",
          });
          return recordDatePST === todayPST;
        });

        // Sort today's logs by earliest clock-in time
        // Prioritize checkInAm, then checkInPm, then the record's 'date' itself
        const sortedLogs = todayLogs.sort((a, b) => {
          const timeA = new Date(
            a.checkInAm || a.checkInPm || a.date
          ).getTime();
          const timeB = new Date(
            b.checkInAm || b.checkInPm || b.date
          ).getTime();
          return timeA - timeB;
        });

        setAttendanceLogs(sortedLogs);
      } catch (err) {
        console.error("Failed to fetch attendance logs:", err);
        setError("Failed to load attendance logs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <>
      {/* Prevent all scrolling on the page */}
      <style>{`
        html, body, #root {
          overflow: hidden !important;
          height: 100%;
        }
      `}</style>
      <div className="p-8 bg-[#eeeeee] min-h-screen font-sans text-[#111111]">
        <h1 className="text-4xl font-bold mb-6 text-[#001325]">
          Today's Attendance Logs
        </h1>
        <div className="bg-white rounded-xl p-6 shadow-md overflow-x-auto">
          {loading ? (
            <div className="text-center">
              <Spinner />
              <p className="text-[#111111]">Loading attendance logs...</p>
            </div>
          ) : error ? (
            <div className="text-center p-4 text-red-600">
              <p>Error: {error}</p>
            </div>
          ) : attendanceLogs.length === 0 ? (
            <p className="text-center text-[#111111] opacity-60 p-4">
              No attendance records for today.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider">
                    AM In
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider">
                    AM Out
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider">
                    PM In
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider">
                    PM Out
                  </th>
                  <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendanceLogs.map((log) => {
                  const status = getAttendanceStatus(log);
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="py-4 px-4 text-base text-[#111111]">
                        {log.employee}
                      </td>
                      <td className="py-4 px-4 text-base text-[#111111]">
                        {formatTime(log.checkInAm)}
                      </td>
                      <td className="py-4 px-4 text-base text-[#111111]">
                        {formatTime(log.checkOutAm)}
                      </td>
                      <td className="py-4 px-4 text-base text-[#111111]">
                        {formatTime(log.checkInPm)}
                      </td>
                      <td className="py-4 px-4 text-base text-[#111111]">
                        {formatTime(log.checkOutPm)}
                      </td>
                      <td className="py-4 px-4 text-base text-[#111111] text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.colorClass}`}
                        >
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
