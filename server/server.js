require("dotenv").config();
const app = require("./app");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const env = require("dotenv");
env.config();

// uses winston for logging
const winston = require("winston");
const path = require("path");

// --- Logging Configuration ---
const logDir = path.join(__dirname, "logs"); // Ensure this matches your Python script's logDir
// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "backend-error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDir, "backend-combined.log"),
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

logger.info("Starting Node.js Backend Server...");

const ipAddress = process.env.IP_ADDRESS || "localhost";

let prisma;
try {
  prisma = new PrismaClient();
  logger.info("Prisma Client initialized successfully.");
} catch (error) {
  logger.error("Error initializing Prisma Client:", error);
  process.exit(1); // Exit if Prisma Client fails to initialize
}

app.use(bodyParser.json({ limit: "50mb" })); // Increase limit for potentially large embeddings

// Middleware for logging requests
app.use((req, res, next) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Helper to convert Python list of floats to Buffer for Prisma Bytes type
const convertFloatListToBuffer = (floatList) => {
  // If your Prisma schema uses `Bytes` for embedding, you'll need to store it as a Buffer.
  // The Python `face_recognition` library uses float32 internally.
  // Convert the list of floats to a Float32Array, then to a Buffer.
  return Buffer.from(new Float32Array(floatList).buffer);
};

// Helper to convert Buffer to Python list of floats for Python consumption
const convertBufferToFloatList = (buffer) => {
  // If you're storing as `Bytes`, retrieve as Buffer and convert back to float array.
  // This assumes the buffer contains Float32Array data.
  return Array.from(
    new Float32Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength / Float32Array.BYTES_PER_ELEMENT
    )
  );
};

// 1. Save embedding for an existing employee (from enrollment)
app.post("/api/embedding", async (req, res) => {
  const { employeeId, embedding } = req.body;
  if (!employeeId || !embedding) {
    logger.warn(
      "Missing employeeId or embedding in /api/embedding POST request."
    );
    return res.status(400).json({
      status: "error",
      message: "Employee ID and embedding are required.",
    });
  }

  try {
    // Since embedding Float[] maps to JSONB, store the array directly
    const faceEmbedding = await prisma.faceEmbedding.create({
      data: {
        employeeId,
        embedding: embedding, // Direct storage of the array
      },
    });
    logger.info(`Successfully saved embedding for employeeId: ${employeeId}`);
    res.json({ status: "success", faceEmbedding });
  } catch (err) {
    logger.error(
      "Error in /api/embedding POST:",
      err.message,
      "Request body:",
      req.body
    );
    res.status(400).json({
      status: "error",
      message: `Failed to save embedding: ${err.message}`,
    });
  }
});

// 2. Get all embeddings (for recognition, to be sent to Python)
app.get("/api/embeddings", async (req, res) => {
  try {
    logger.info("Requesting all face embeddings from database.");
    const employeeEmbeddings = await prisma.faceEmbedding.findMany({
      select: {
        id: true,
        embedding: true,
        employeeId: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            role: {
              // CORRECTED: Use 'select' to pick fields from the related Role model
              select: {
                name: true, // Assuming your 'Role' model has a 'name' field
              },
            },
          },
        },
      },
    });

    // Format the data to match what your Electron app and Python script expect
    // The Python script expects 'name' and 'role.name'
    const formattedEmbeddings = employeeEmbeddings.map((entry) => ({
      id: entry.id,
      employeeId: entry.employeeId,
      embedding: entry.embedding,
      // Combine first and last name for the 'name' field
      name: `${entry.employee.firstName} ${entry.employee.lastName}`,
      // Keep the 'role' as a nested object with 'name' property
      role: {
        name: entry.employee.role.name,
      },
    }));

    res.json({ status: "success", embeddings: formattedEmbeddings });
  } catch (error) {
    logger.error(`Error fetching embeddings: ${error.stack}`); // Log the full stack for better debugging
    res.status(500).json({
      status: "error",
      message: `Failed to fetch embeddings: ${error.message}`,
    });
  }
});

// 3. Process Attendance (NEW ROUTE - handles both create and update logic)
app.post("/api/process-attendance", async (req, res) => {
  // Destructure timeWindow along with employeeId from the request body
  const { employeeId, recognitionTime, timeWindow } = req.body;

  if (!employeeId) {
    logger.warn("Missing employeeId in /api/process-attendance POST request.");
    return res.status(400).json({
      status: "error",
      message: "Employee ID is required for attendance processing.",
    });
  }

  const currentDateTime = new Date();
  const today = new Date(
    currentDateTime.getFullYear(),
    currentDateTime.getMonth(),
    currentDateTime.getDate()
  );
  logger.info(
    `Processing attendance for employee: ${employeeId} on ${
      today.toISOString().split("T")[0]
    }`
  );
  logger.info(`Received timeWindow parameter: ${timeWindow || "None"}`);

  try {
    let attendanceRecord = await prisma.attendance.findFirst({
      where: {
        employeeId: employeeId,
        date: today,
      },
    });

    let updateField = null;
    let updateValue = recognitionTime;

    if (timeWindow) {
      // Use the provided timeWindow to explicitly set the update field
      switch (timeWindow) {
        case "AM In":
          updateField = "checkInAm";
          break;
        case "AM Out":
          updateField = "checkOutAm";
          break;
        case "PM In":
          updateField = "checkInPm";
          break;
        case "PM Out":
          updateField = "checkOutPm";
          break;
        default:
          return res.status(400).json({
            status: "error",
            message: "Invalid timeWindow value provided.",
          });
      }
      logger.info(`Explicitly setting ${updateField} based on time window.`);
    } else {
      // Fallback to the default time-based logic
      const currentHour = currentDateTime.getHours();
      const amStartHour = 8;
      const amCutoffHour = 12; // 12 PM (noon)
      const pmStartHour = 13; // 1 PM
      const pmCutoffHour = 17; // 5 PM

      if (!attendanceRecord) {
        // Only create a new record if it's within working hours
        if (currentHour >= amStartHour && currentHour < pmCutoffHour) {
          updateField = "checkInAm";
          logger.info(`Creating new attendance record - checkInAm.`);
        }
      } else {
        // Record exists, determine update logic based on current time
        logger.info(
          `Existing record found: ${JSON.stringify(attendanceRecord)}`
        );

        if (
          !attendanceRecord.checkInAm &&
          currentHour >= amStartHour &&
          currentHour < amCutoffHour
        ) {
          updateField = "checkInAm";
          logger.info(`Updating checkInAm.`);
        } else if (
          attendanceRecord.checkInAm &&
          !attendanceRecord.checkOutAm &&
          currentHour >= amStartHour &&
          currentHour < pmStartHour
        ) {
          updateField = "checkOutAm";
          logger.info(`Updating checkOutAm.`);
        } else if (
          attendanceRecord.checkOutAm &&
          !attendanceRecord.checkInPm &&
          currentHour >= pmStartHour &&
          currentHour < pmCutoffHour
        ) {
          updateField = "checkInPm";
          logger.info(`Updating checkInPm.`);
        } else if (
          attendanceRecord.checkInPm &&
          !attendanceRecord.checkOutPm &&
          currentHour >= pmStartHour &&
          currentHour < pmCutoffHour
        ) {
          updateField = "checkOutPm";
          logger.info(`Updating checkOutPm.`);
        } else {
          logger.warn(
            `No valid attendance field to update. Record might be complete or out of sequence.`
          );
          return res.status(409).json({
            status: "info",
            message: `Attendance already recorded for this period or no valid next action.`,
            attendance: attendanceRecord,
          });
        }
      }
    }

    if (!updateField) {
      // Handles cases where no timeWindow and no valid default action
      logger.warn(`No attendance field to update for employee: ${employeeId}.`);
      return res.status(409).json({
        status: "info",
        message: `Attendance cannot be recorded at this time.`,
      });
    }

    if (!attendanceRecord) {
      // Create new record for the first entry
      attendanceRecord = await prisma.attendance.create({
        data: {
          employeeId,
          status: "Present",
          date: today,
          [updateField]: updateValue,
        },
      });
      logger.info(`Successfully created new record and set ${updateField}.`);
    } else {
      // Update existing record
      attendanceRecord = await prisma.attendance.update({
        where: { id: attendanceRecord.id },
        data: {
          [updateField]: updateValue,
        },
      });
      logger.info(
        `Successfully updated ${updateField} for employee: ${employeeId}.`
      );
    }

    return res.json({
      status: "success",
      message: `${updateField} recorded for ${employeeId}.`,
      attendance: attendanceRecord,
    });
  } catch (err) {
    logger.error(
      "Error in /api/process-attendance:",
      err.message,
      "Employee ID:",
      employeeId
    );
    res.status(500).json({
      status: "error",
      message: `Failed to process attendance: ${err.message}`,
    });
  }
});

app.post("/api/process-attendance-batch", async (req, res) => {
  const records = req.body.records; // Array of unsynced records from the client

  // Validate that records array is present and is an array
  if (!records || !Array.isArray(records) || records.length === 0) {
    logger.warn(
      "Received empty or invalid records array for batch processing."
    );
    return res
      .status(400)
      .json({ message: "No records provided for batch processing." });
  }

  const processedRecords = []; // To track successfully processed records (by local ID)
  const errors = []; // To track records that failed processing

  for (const record of records) {
    try {
      const { employeeId, recognitionTime, timeWindow } = record;

      // Basic validation for essential fields in each incoming record
      if (!employeeId || !recognitionTime || !timeWindow) {
        const errorMessage =
          "Missing essential fields (employeeId, recognitionTime, or timeWindow) in record.";
        logger.error(
          `Validation error for record: %o - ${errorMessage}`,
          record
        );
        errors.push({
          localId: record.id,
          employeeId: record.employeeId,
          error: errorMessage,
        });
        continue; // Skip to the next record in the batch
      }

      // Convert the recognitionTime ISO string to a Date object for database storage
      const recordDateTime = new Date(recognitionTime);

      // Initialize attendance data with common fields
      const attendanceData = {
        employeeId: Number(employeeId),
        date: recordDateTime, // Store the exact recognition timestamp in the 'date' field
        status: "Present", // Default status for any clock-in/out activity
        // Initialize all check-in/out fields to null, then set the relevant one
        checkInAm: null,
        checkOutAm: null,
        checkInPm: null,
        checkOutPm: null,
      };

      // Set the specific check-in/out time based on the timeWindow
      switch (timeWindow) {
        case "AM In":
          attendanceData.checkInAm = recordDateTime;
          break;
        case "AM Out":
          attendanceData.checkOutAm = recordDateTime;
          break;
        case "PM In":
          attendanceData.checkInPm = recordDateTime;
          break;
        case "PM Out":
          attendanceData.checkOutPm = recordDateTime;
          break;
        default:
          const invalidTimeWindowError = `Invalid timeWindow '${timeWindow}'.`;
          logger.error(
            `Validation error for record: %o - ${invalidTimeWindowError}`,
            record
          );
          errors.push({
            localId: record.id,
            employeeId: record.employeeId,
            error: invalidTimeWindowError,
          });
          continue; // Skip to the next record
      }

      // Create a new attendance entry in the database
      const newAttendance = await prisma.attendance.create({
        data: attendanceData,
      });

      logger.info(
        `Created new attendance record in DB for employee ${employeeId} (Local ID: ${record.id}). DB ID: ${newAttendance.id}`
      );
      processedRecords.push({
        localId: record.id,
        dbId: newAttendance.id,
        status: "created",
      });
    } catch (dbError) {
      // Log any database-related errors during processing of a single record
      logger.error(
        `Error creating DB record for local ID ${record.id} (Employee ID: ${record.employeeId}): ${dbError.message}`,
        dbError.stack
      );
      errors.push({
        localId: record.id,
        employeeId: record.employeeId,
        error: dbError.message,
      });
    }
  }

  // Send a response back to the client indicating the outcome of the batch processing
  if (errors.length > 0) {
    // If there were any errors, return a 200 OK but with details of failures.
    // This allows the client to know which records to keep in its unsynced queue for retry.
    res.status(200).json({
      status: "partial_success",
      message: `Processed ${processedRecords.length} records. ${errors.length} records failed.`,
      processedRecords, // List of records successfully processed
      failedRecords: errors, // List of records that failed and their errors
    });
  } else {
    // If all records were processed successfully
    res.status(200).json({
      status: "success",
      message: `Successfully processed ${processedRecords.length} attendance records.`,
      processedRecords,
    });
  }
});

// 4. Get attendance records (for UI) - No change here, looks good.
app.get("/api/attendance", async (req, res) => {
  try {
    logger.info("Fetching attendance records for UI.");
    const records = await prisma.attendance.findMany({
      select: {
        id: true,
        checkInAm: true,
        checkOutAm: true,
        checkInPm: true,
        checkOutPm: true,
        status: true,
        date: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            position: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 40,
    });
    const formatted = records.map((r) => ({
      id: `${r.id}`,
      employee: `${r.employee.firstName} ${r.employee.lastName}`,
      checkInAm: r.checkInAm,
      checkOutAm: r.checkOutAm,
      checkInPm: r.checkInPm,
      checkOutPm: r.checkOutPm,
      status: r.status,
      date: r.date,
    }));
    logger.info(`Fetched ${formatted.length} attendance records.`);
    res.json({ status: "success", records: formatted });
  } catch (err) {
    logger.error("Error in /api/attendance GET:", err.message);
    res.status(500).json({ status: "attendance error", message: err.message });
  }
});
app.get("/api/employee/:id", async (req, res) => {
  const employeeId = req.params.id; // It's a string from URL params
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }, // Use employeeId directly if it's string/UUID
      // where: { id: parseInt(employeeId) }, // If employee ID is integer
    });
    if (!employee) {
      logger.warn(`Employee not found: ID ${employeeId}`);
      return res
        .status(404)
        .json({ status: "error", message: "Employee not found" });
    }
    logger.info(`Fetched employee: ${employee.firstName} ${employee.lastName}`);
    res.json({ status: "success", employee });
  } catch (err) {
    logger.error(
      "Error in /api/employee/:id:",
      err.message,
      "Params:",
      req.params
    );
    res.status(404).json({
      status: "error",
      message: `Failed to find employee: ${err.message}`,
    });
  }
});

// Route to get all employee IDs (and optionally names)
app.get("/api/employee", async (req, res) => {
  try {
    logger.info("Fetching employee records for UI.");
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        employee_uuid: true,
        position: true,
        division: true,
        firstname: true,
        middlename: true,
        lastname: true,
        role: true,
        faceEmbedding: true,
      },
    });
    res.json({ status: "success", employees });
  } catch (err) {
    logger.error("Error in /api/employee GET:", err.message);
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch employees" });
  }
});

app.post("/api/recognition-result", async (req, res) => {
  const { status, message, data, frame_base64 } = req.body;
  logger.info(
    `Received recognition result from Electron Main: Status=${status}, Message=${message}, Image=${frame_base64}`
  );

  if (status === "success" && data && data.employeeId) {
    const { employeeId, name } = data;
    logger.info(
      `Face recognized: Employee ID: ${employeeId}, Name: ${name || "N/A"}`
    );

    try {
      // Step 1: Process attendance
      // We'll call the internal attendance processing logic directly here.
      // This avoids an extra HTTP request and keeps it centralized.
      const attendanceRes = await processAttendanceInternal(employeeId);

      // Determine the final message for the frontend
      let finalMessage = `Recognized: ${name || employeeId}. `;
      let attendanceMessage = attendanceRes.message || "Attendance recorded.";

      // Combine messages for a UX-friendly response
      finalMessage += attendanceMessage;

      res.json({
        status: "success",
        message: finalMessage,
        employeeId: employeeId,
        employeeName: name,
        attendanceRecord: attendanceRes.attendance,
        frame_base64: frame_base64, // Pass the image directly to the frontend
      });
      logger.info(
        `Successfully processed recognition and attendance for ${employeeId}.`
      );
    } catch (attendanceError) {
      logger.error(
        `Error processing attendance for ${employeeId}: ${attendanceError.message}`
      );
      // If attendance fails, still report recognition success, but with attendance error
      res.status(200).json({
        // Still 200 OK because recognition was successful
        status: "success_with_attendance_error",
        message: `Recognized: ${
          name || employeeId
        }, but attendance processing failed: ${attendanceError.message}`,
        employeeId: employeeId,
        employeeName: name,
        frame_base64: frame_base64, // Still pass the image
      });
    }
  } else if (status === "fail") {
    logger.info(`Recognition failed: ${message}`);
    res.json({
      status: "fail",
      message: message, // "No known face recognized."
      frame_base64: frame_base64,
    });
  } else {
    logger.error(
      `Unexpected recognition result format: ${JSON.stringify(req.body)}`
    );
    res.status(400).json({
      status: "error",
      message: "Invalid recognition result format from Python.",
      details: req.body,
    });
  }
});

// --- INTERNAL FUNCTION TO PROCESS ATTENDANCE (extracted from /api/process-attendance) ---
// This function will be called internally by /api/recognition-result
// It returns a promise that resolves with the attendance outcome.
async function processAttendanceInternal(employeeId) {
  const currentDateTime = new Date();
  const today = new Date(
    currentDateTime.getFullYear(),
    currentDateTime.getMonth(),
    currentDateTime.getDate()
  );
  logger.info(
    `Internal attendance processing for employee: ${employeeId} on ${
      today.toISOString().split("T")[0]
    }`
  );

  let attendanceRecord = await prisma.attendance.findFirst({
    where: {
      employeeId: employeeId,
      date: today,
    },
  });

  let updateField = null;
  let updateValue = currentDateTime;

  const amStartHour = 8;
  const amCutoffHour = 12; // 12 PM (noon)
  const pmStartHour = 12;
  const pmCutoffHour = 17; // 5 PM

  const currentHour = currentDateTime.getHours();

  let message = "";

  if (!attendanceRecord) {
    updateField = "checkInAm";
    message = `Check-in AM recorded for ${employeeId}.`;
    logger.info(
      `Creating new attendance record for ${employeeId} - checkInAm.`
    );
    attendanceRecord = await prisma.attendance.create({
      data: {
        employeeId,
        status: "Present",
        date: today,
        [updateField]: updateValue,
      },
    });
  } else {
    logger.info(
      `Existing attendance record found for ${employeeId}: ${JSON.stringify(
        attendanceRecord
      )}`
    );

    if (!attendanceRecord.checkInAm && currentHour < amCutoffHour) {
      updateField = "checkInAm";
      message = `Check-in AM recorded for ${employeeId}.`;
    } else if (
      attendanceRecord.checkInAm &&
      !attendanceRecord.checkOutAm &&
      currentHour >= amCutoffHour &&
      currentHour < pmCutoffHour
    ) {
      updateField = "checkOutAm";
      message = `Check-out AM recorded for ${employeeId}.`;
    } else if (
      attendanceRecord.checkOutAm &&
      !attendanceRecord.checkInPm &&
      currentHour >= pmCutoffHour
    ) {
      updateField = "checkInPm";
      message = `Check-in PM recorded for ${employeeId}.`;
    } else if (attendanceRecord.checkInPm && !attendanceRecord.checkOutPm) {
      updateField = "checkOutPm";
      message = `Check-out PM recorded for ${employeeId}.`;
    } else {
      message = `Attendance already recorded for this period or no valid next action for ${employeeId}.`;
      logger.warn(
        `No valid attendance field to update for ${employeeId}. Record might be complete or out of sequence.`
      );
      return {
        status: "info",
        message: message,
        attendance: attendanceRecord,
      };
    }

    if (updateField) {
      attendanceRecord = await prisma.attendance.update({
        where: { id: attendanceRecord.id },
        data: {
          [updateField]: updateValue,
        },
      });
      logger.info(`Successfully updated ${updateField} for ${employeeId}.`);
    }
  }

  return {
    status: "success",
    message: message,
    attendance: attendanceRecord,
  };
}

// Existing /api/attendance PUT route (might be redundant now but keeping for reference)
// The new /api/process-attendance effectively replaces its role in automated attendance.
app.post("/api/process-attendance", async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) {
    logger.warn("Missing employeeId in /api/process-attendance POST request.");
    return res.status(400).json({
      status: "error",
      message: "Employee ID is required for attendance processing.",
    });
  }

  try {
    const result = await processAttendanceInternal(employeeId);
    if (result.status === "success" || result.status === "info") {
      res.json(result);
    } else {
      // This else block handles unexpected internal errors from processAttendanceInternal
      logger.error(
        `Unexpected result from processAttendanceInternal for employee ${employeeId}: ${JSON.stringify(
          result
        )}`
      );
      res.status(500).json({
        status: "error",
        message: `Failed to process attendance internally: ${
          result.message || "Unknown error"
        }`,
        details: result,
      });
    }
  } catch (err) {
    logger.error(
      "Error in /api/process-attendance (external call):",
      err.message,
      "Employee ID:",
      employeeId
    );
    res.status(500).json({
      status: "error",
      message: `Failed to process attendance: ${err.message}`,
    });
  }
});

// Polyfill for Date.prototype.isValid for older Node.js or explicit check
if (!Date.prototype.isValid) {
  Date.prototype.isValid = function () {
    return !isNaN(this.getTime());
  };
}

// Global error handler (fallback)
app.use((err, req, res, next) => {
  logger.error("Unhandled server error:", err);
  res.status(500).json({ status: "error", message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

