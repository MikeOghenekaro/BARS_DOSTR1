import React, { useState, useEffect } from "react";
import { APP_URL } from "@/lib/constants";

// Define the API base URL based on your Electron app's port
const API_BASE_URL = `${APP_URL}/api`;

// Simple Spinner Component (using Tailwind classes for basic styling)
const Spinner = () => (
  <div className="border-4 border-gray-200 border-l-[#0084ff] rounded-full w-8 h-8 animate-spin mx-auto my-5"></div>
);

// Helper to format date/time
const formatTime = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function Dashboard() {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [employeesPresentToday, setEmployeesPresentToday] = useState(0);
  const [employeesNotClockedInToday, setEmployeesNotClockedInToday] =
    useState(0);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Employees
        const employeeResponse = await fetch(`${API_BASE_URL}/employee`);
        if (!employeeResponse.ok) {
          throw new Error(
            `HTTP error! status: ${employeeResponse.status} from /api/employee`
          );
        }
        const employeeData = await employeeResponse.json();
        const total = employeeData.employees
          ? employeeData.employees.length
          : 0;
        setTotalEmployees(total);

        // Fetch Attendance
        const attendanceResponse = await fetch(`${API_BASE_URL}/attendance`);
        if (!attendanceResponse.ok) {
          throw new Error(
            `HTTP error! status: ${attendanceResponse.status} from /api/attendance`
          );
        }
        const attendanceData = await attendanceResponse.json();
        console.log("Raw Attendance Data:", attendanceData); // Keep this for debugging

        // Get current date in Philippine local time (PST)
        const now = new Date();
        const todayPST = now.toLocaleDateString("en-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: "Asia/Manila", // Philippine Standard Time
        });

        const todayRecords = attendanceData.records
          ? attendanceData.records.filter((record) => {
              // Find the first valid timestamp in the record to determine its date
              const relevantTimestamp =
                record.checkInAm ||
                record.checkInPm ||
                record.checkOutAm ||
                record.checkOutPm; // Consider any timestamp for date comparison

              if (!relevantTimestamp) {
                return false; // Skip records without any timestamp
              }

              const recordDate = new Date(relevantTimestamp); // Use relevant timestamp
              if (isNaN(recordDate.getTime())) {
                  // Check if the date is valid
                  console.warn("Invalid date encountered in record:", relevantTimestamp, record);
                  return false;
              }

              // Convert recordDate to a PST date string for comparison
              const recordDatePST = recordDate.toLocaleDateString("en-CA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                timeZone: "Asia/Manila",
              });

              return recordDatePST === todayPST;
            })
          : [];

        console.log("Today's filtered records (PST):", todayRecords); // Log filtered records

        // Calculate employees present today
        const presentEmployeeNames = new Set();
        todayRecords.forEach((record) => {
          if (record.checkInAm || record.checkInPm) {
            presentEmployeeNames.add(record.employee);
          }
        });
        setEmployeesPresentToday(presentEmployeeNames.size);
        setEmployeesNotClockedInToday(total - presentEmployeeNames.size);

        // Process recent attendance activity (earliest to latest for today's entries)
        const sortedRecentActivity = todayRecords
          .sort((a, b) => {
            // Use the earliest of any timestamp for sorting
            const timeA = new Date(a.checkInAm || a.checkInPm || a.checkOutAm || a.checkOutPm || "1970-01-01");
            const timeB = new Date(b.checkInAm || b.checkInPm || b.checkOutAm || b.checkOutPm || "1970-01-01");
            return timeA.getTime() - timeB.getTime();
          })
          .slice(0, 5); // Limit to 5 most recent activities for a clean overview

        setRecentAttendance(sortedRecentActivity);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 bg-[#eeeeee] min-h-screen font-sans text-[#111111]">
      <h1 className="text-4xl font-bold mb-6 text-[#001325]">
        Dashboard Overview
      </h1>

      {loading ? (
        <div className="text-center">
          <Spinner />
          <p className="text-[#111111]">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="text-center p-4 text-red-600">
          <p>Error: {error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
              <div className="text-base text-[#001325] mb-2 opacity-70">
                Total Employees
              </div>
              <div className="text-5xl font-bold text-[#0084ff]">
                {totalEmployees}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
              <div className="text-base text-[#001325] mb-2 opacity-70">
                Employees Present Today
              </div>
              <div className="text-5xl font-bold text-[#0084ff]">
                {employeesPresentToday}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md flex flex-col justify-between">
              <div className="text-base text-[#001325] mb-2 opacity-70">
                Employees Not Clocked In Today
              </div>
              <div className="text-5xl font-bold text-[#0084ff]">
                {employeesNotClockedInToday}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-[#001325] mb-4">
              Today's Recent Activity
            </h2>
            {recentAttendance.length > 0 ? (
              <ul className="list-none p-0 m-0">
                {recentAttendance.map((record, index) => (
                  <li
                    key={record.id}
                    className={`flex justify-between py-3 text-sm text-[#111111] ${
                      index === recentAttendance.length - 1
                        ? ""
                        : "border-b border-gray-200"
                    }`}
                  >
                    <span>{record.employee}</span>
                    <span className="text-[#0084ff] font-bold">
                      {formatTime(
                        record.checkInAm || record.checkInPm // Still fallback to record.date just in case, though it's likely not there
                      )}{" "}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-[#111111] opacity-60 p-4">
                No clock-in/out activity recorded for today yet.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}