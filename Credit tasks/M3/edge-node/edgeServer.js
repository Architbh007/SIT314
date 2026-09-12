require("dotenv").config();

const express =
  require("express");

const axios =
  require("axios");

const {
  connectDatabase
} = require("./database");

const {
  makeDecision
} = require(
  "./decisionEngine"
);

const SensorReading =
  require(
    "../models/SensorReading"
  );

const HVACRequest =
  require(
    "../models/HVACRequest"
  );

const HVACStatusChange =
  require(
    "../models/HVACStatusChange"
  );

const app = express();

const PORT = 3002;

const HVAC_URL =
  process.env.HVAC_URL ||
  "http://localhost:3001";

app.use(
  express.json()
);

function validateSensorReading(
  reading
) {
  if (!reading.sensorId) {
    return "sensorId is required";
  }

  if (!reading.zone) {
    return "zone is required";
  }

  if (!reading.timestamp) {
    return "timestamp is required";
  }

  const numericFields = [
    "temperature",
    "humidity",
    "chairsOccupied",
    "totalChairs"
  ];

  for (
    const field of
      numericFields
  ) {
    if (
      typeof reading[field] !==
        "number" ||
      Number.isNaN(
        reading[field]
      )
    ) {
      return (
        `${field} must be ` +
        "a valid number"
      );
    }
  }

  if (
    reading.chairsOccupied <
      0 ||
    reading.chairsOccupied >
      reading.totalChairs
  ) {
    return (
      "chairsOccupied must be " +
      "between 0 and totalChairs"
    );
  }

  if (
    reading.humidity < 0 ||
    reading.humidity > 100
  ) {
    return (
      "humidity must be " +
      "between 0 and 100"
    );
  }

  return null;
}

function aggregateReadings(
  readings
) {
  const totalTemperature =
    readings.reduce(
      (sum, reading) =>
        sum +
        reading.temperature,
      0
    );

  const totalHumidity =
    readings.reduce(
      (sum, reading) =>
        sum +
        reading.humidity,
      0
    );

  const totalOccupied =
    readings.reduce(
      (sum, reading) =>
        sum +
        reading.chairsOccupied,
      0
    );

  const totalChairs =
    readings.reduce(
      (sum, reading) =>
        sum +
        reading.totalChairs,
      0
    );

  return {
    sensorId:
      "seminar-room-aggregate",

    timestamp:
      new Date().toISOString(),

    temperature:
      Number(
        (
          totalTemperature /
          readings.length
        ).toFixed(1)
      ),

    humidity:
      Math.round(
        totalHumidity /
          readings.length
      ),

    chairsOccupied:
      totalOccupied,

    totalChairs
  };
}

function configurationChanged(
  previousState,
  newState
) {
  return (
    previousState.mode !==
      newState.mode ||

    previousState
      .targetTemperature !==
      newState
        .targetTemperature ||

    previousState
      .fanSpeed !==
      newState.fanSpeed ||

    previousState
      .ventilation !==
      newState.ventilation
  );
}

async function processSensorReadings(
  readings
) {
  const databaseReadings =
    readings.map(
      (reading) => ({
        ...reading,

        timestamp:
          new Date(
            reading.timestamp
          )
      })
    );

  await SensorReading.insertMany(
    databaseReadings
  );

  console.log(
    "\nSensor readings received"
  );

  for (
    const reading of
      databaseReadings
  ) {
    console.log(
      `${reading.zone}: ` +
      `${reading.temperature}°C | ` +
      `${reading.humidity}% humidity | ` +
      `${reading.chairsOccupied}/${reading.totalChairs} occupied`
    );
  }

  const roomReading =
    aggregateReadings(
      databaseReadings
    );

  console.log(
    "\nAggregated room conditions"
  );

  console.log(
    `Temperature: ${roomReading.temperature}°C`
  );

  console.log(
    `Humidity: ${roomReading.humidity}%`
  );

  console.log(
    `Occupancy: ${roomReading.chairsOccupied}/${roomReading.totalChairs}`
  );

  let currentHVACState;

  try {
    const statusResponse =
      await axios.get(
        `${HVAC_URL}/hvac/status`,
        {
          timeout: 5000
        }
      );

    currentHVACState =
      statusResponse.data;
  } catch (error) {
    await HVACRequest.create({
      sensorId:
        roomReading.sensorId,

      sensorReading: {
        temperature:
          roomReading.temperature,

        humidity:
          roomReading.humidity,

        chairsOccupied:
          roomReading
            .chairsOccupied,

        totalChairs:
          roomReading.totalChairs
      },

      requestedConfiguration:
        {},

      reason:
        "Unable to retrieve current HVAC status.",

      requestStatus:
        "FAILED",

      errorMessage:
        error.message
    });

    throw new Error(
      "HVAC Node is unavailable"
    );
  }

  const decision =
    makeDecision(
      roomReading,
      currentHVACState
    );

  console.log(
    "\nEdge decision"
  );

  console.log(
    `Mode: ${decision.mode}`
  );

  console.log(
    `Target temperature: ${decision.targetTemperature}`
  );

  console.log(
    `Fan speed: ${decision.fanSpeed}`
  );

  console.log(
    `Ventilation: ${decision.ventilation}`
  );

  console.log(
    `Reason: ${decision.reason}`
  );

  try {
    const hvacResponse =
      await axios.post(
        `${HVAC_URL}/hvac/config`,

        {
          mode:
            decision.mode,

          targetTemperature:
            decision
              .targetTemperature,

          fanSpeed:
            decision.fanSpeed,

          ventilation:
            decision.ventilation
        },

        {
          timeout: 5000
        }
      );

    await HVACRequest.create({
      sensorId:
        roomReading.sensorId,

      sensorReading: {
        temperature:
          roomReading.temperature,

        humidity:
          roomReading.humidity,

        chairsOccupied:
          roomReading
            .chairsOccupied,

        totalChairs:
          roomReading.totalChairs
      },

      requestedConfiguration: {
        mode:
          decision.mode,

        targetTemperature:
          decision
            .targetTemperature,

        fanSpeed:
          decision.fanSpeed,

        ventilation:
          decision.ventilation
      },

      reason:
        decision.reason,

      requestStatus:
        "SUCCESS"
    });

    const previousState =
      hvacResponse.data
        .previousState;

    const newState =
      hvacResponse.data
        .currentState;

    if (
      configurationChanged(
        previousState,
        newState
      )
    ) {
      await HVACStatusChange.create(
        {
          previousState,

          newState,

          reason:
            decision.reason,

          triggeredBySensorId:
            roomReading.sensorId
        }
      );

      console.log(
        "HVAC state change logged to MongoDB"
      );
    } else {
      console.log(
        "HVAC configuration remained unchanged"
      );
    }

    return {
      message:
        "Sensor data processed successfully",

      roomReading,

      decision,

      hvacState:
        newState
    };
  } catch (error) {
    await HVACRequest.create({
      sensorId:
        roomReading.sensorId,

      sensorReading: {
        temperature:
          roomReading.temperature,

        humidity:
          roomReading.humidity,

        chairsOccupied:
          roomReading
            .chairsOccupied,

        totalChairs:
          roomReading.totalChairs
      },

      requestedConfiguration: {
        mode:
          decision.mode,

        targetTemperature:
          decision
            .targetTemperature,

        fanSpeed:
          decision.fanSpeed,

        ventilation:
          decision.ventilation
      },

      reason:
        decision.reason,

      requestStatus:
        "FAILED",

      errorMessage:
        error.message
    });

    throw error;
  }
}

app.get(
  "/",
  (req, res) => {
    res.json({
      node: "Edge Node",
      status: "running"
    });
  }
);

app.post(
  "/api/sensor-batch",

  async (req, res) => {
    const readings =
      req.body.readings;

    if (
      !Array.isArray(
        readings
      ) ||
      readings.length === 0
    ) {
      return res
        .status(400)
        .json({
          error:
            "readings must be a non-empty array"
        });
    }

    for (
      const reading of readings
    ) {
      const validationError =
        validateSensorReading(
          reading
        );

      if (validationError) {
        return res
          .status(400)
          .json({
            error:
              `${
                reading.sensorId ||
                "Unknown sensor"
              }: ${validationError}`
          });
      }
    }

    try {
      const result =
        await processSensorReadings(
          readings
        );

      res.json(result);
    } catch (error) {
      console.error(
        "Edge processing error:",
        error.message
      );

      res
        .status(500)
        .json({
          error:
            "Failed to process sensor data",

          details:
            error.message
        });
    }
  }
);

app.get(
  "/api/recent-readings",

  async (req, res) => {
    try {
      const readings =
        await SensorReading.find()
          .sort({
            timestamp: -1
          })
          .limit(30)
          .lean();

      res.json(readings);
    } catch (error) {
      res
        .status(500)
        .json({
          error:
            error.message
        });
    }
  }
);

app.get(
  "/api/recent-hvac-requests",

  async (req, res) => {
    try {
      const requests =
        await HVACRequest.find()
          .sort({
            timestamp: -1
          })
          .limit(20)
          .lean();

      res.json(requests);
    } catch (error) {
      res
        .status(500)
        .json({
          error:
            error.message
        });
    }
  }
);

app.get(
  "/api/recent-status-changes",

  async (req, res) => {
    try {
      const changes =
        await HVACStatusChange.find()
          .sort({
            timestamp: -1
          })
          .limit(20)
          .lean();

      res.json(changes);
    } catch (error) {
      res
        .status(500)
        .json({
          error:
            error.message
        });
    }
  }
);

async function startServer() {
  try {
    await connectDatabase();

    app.listen(
      PORT,
      () => {
        console.log(
          `Edge Node running on http://localhost:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start Edge Node:",
      error.message
    );

    process.exit(1);
  }
}

startServer();