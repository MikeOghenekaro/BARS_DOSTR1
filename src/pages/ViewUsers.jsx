import React, { useState, useEffect } from "react";
import { APP_URL } from "@/lib/constants";

// Define the API base URL based on your Electron app's port
const API_BASE_URL = `${APP_URL}/api`;

// Simple Spinner Component (using Tailwind classes)
const Spinner = () => (
  <div className="border-4 border-gray-200 border-l-[#0084ff] rounded-full w-8 h-8 animate-spin mx-auto my-5"></div>
);

export default function Users() {

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsersData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Employees data
        const employeeResponse = await fetch(`${API_BASE_URL}/employee`);
        if (!employeeResponse.ok) {
          throw new Error(
            `HTTP error! status: ${employeeResponse.status} from /api/employee`
          );
        }
        const employeeData = await employeeResponse.json();
        const fetchedEmployees = employeeData.employees || [];

        // Fetch Attendance data for today's presence
        const attendanceResponse = await fetch(`${API_BASE_URL}/attendance`);
        if (!attendanceResponse.ok) {
          throw new Error(
            `HTTP error! status: ${attendanceResponse.status} from /api/attendance`
          );
        }
        const attendanceRecords = await attendanceResponse.json();
        const recordsToday = attendanceRecords.records || [];

        // Get current date in Philippine local time (PST) for accurate 'today' comparison
        const now = new Date();
        const todayPST = now.toLocaleDateString("en-CA", {
          // 'en-CA' for YYYY-MM-DD format
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: "Asia/Manila", // Philippine Standard Time
        });

        // Create a map of present employees for today
        const presentTodayMap = new Map(); // Key: "FirstName LastName", Value: true
        recordsToday.forEach((record) => {
          const recordDateUTC = new Date(record.date);
          const recordDatePST = recordDateUTC.toLocaleDateString("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            timeZone: "Asia/Manila",
          });

          if (
            recordDatePST === todayPST &&
            (record.checkInAm || record.checkInPm)
          ) {
            presentTodayMap.set(record.employee, true);
          }
        });

        // Enrich employee data
        const enrichedEmployees = fetchedEmployees.map((emp) => {
          const fullName = `${emp.firstName} ${emp.lastName}`;
          return {
            ...emp,
            fullName: fullName,
            // Placeholder for embeddings status:
            // In a real application, this would come from the API or another service.
            // For now, it's randomly assigned for demonstration purposes.
            hasEmbeddings: Math.random() > 0.5, // Dummy value
            isPresentToday: presentTodayMap.has(fullName), // Check if employee is in today's present map
          };
        });

        setEmployees(enrichedEmployees);
      } catch (err) {
        console.error("Failed to fetch users data:", err);
        setError("Failed to load employee data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsersData();
  }, []);

  return (
    <div className="p-8 bg-[#eeeeee] min-h-screen font-sans text-[#111111]">
      <h1 className="text-4xl font-bold mb-6 text-[#001325]">
        Employees Overview
      </h1>

      <div className="bg-white rounded-xl p-6 shadow-md overflow-x-auto">
        {loading ? (
          <div className="text-center">
            <Spinner />
            <p className="text-[#111111]">Loading employee data...</p>
          </div>
        ) : error ? (
          <div className="text-center p-4 text-red-600">
            <p>Error: {error}</p>
          </div>
        ) : employees.length === 0 ? (
          <p className="text-center text-[#111111] opacity-60 p-4">
            No employees found.
          </p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider">
                  Position
                </th>
                <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider">
                  Unit
                </th>
                <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider text-center">
                  Embeddings
                </th>
                <th className="py-3 px-4 text-sm font-medium text-[#001325] opacity-70 uppercase tracking-wider text-center">
                  Present Today
                </th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="py-4 px-4 text-base text-[#111111]">
                    {employee.fullName}
                  </td>
                  <td className="py-4 px-4 text-base text-[#111111]">
                    {employee.role?.name}
                  </td>
                  <td className="py-4 px-4 text-base text-[#111111]">
                    {employee.unit?.name || "N/A"}
                  </td>
                  <td className="py-4 px-4 text-base text-[#111111] text-center">
                    {employee.faceEmbedding.length > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-2 h-2 mr-1 rounded-full bg-green-500"></span>{" "}
                        In System
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="w-2 h-2 mr-1 rounded-full bg-red-500"></span>{" "}
                        Not Enrolled
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-base text-[#111111] text-center">
                    {employee.isPresentToday ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-[#0084ff]">
                        <span className="w-2 h-2 mr-1 rounded-full bg-[#0084ff]"></span>{" "}
                        Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <span className="w-2 h-2 mr-1 rounded-full bg-gray-400"></span>{" "}
                        Absent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
