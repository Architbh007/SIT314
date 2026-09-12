require("dotenv").config();

const express = require("express");
const axios = require("axios");

const {
  updateSimulation,
  setScenario,
  getCurrentState
} = require("./sensorSimulator");

const app = express();

const PORT = 3000;

const EDGE_URL =
  process.env.EDGE_URL ||
  "http://localhost:3002";

const SENSOR_INTERVAL_MS =
  Number(
    process.env.SENSOR_INTERVAL_MS
  ) || 5000;

app.use(express.json());

async function sendReadingsToEdge(
  readings
) {
  const response = await axios.post(
    `${EDGE_URL}/api/sensor-batch`,
    {
      readings
    },
    {
      timeout: 5000
    }
  );

  return response.data;
}

function displayReadings(readings) {
  console.log(
    "\nNew seminar room sensor readings"
  );

  for (const reading of readings) {
    console.log(
      `${reading.zone}: ` +
      `${reading.temperature}°C | ` +
      `${reading.humidity}% humidity | ` +
      `${reading.chairsOccupied}/${reading.totalChairs} chairs occupied`
    );
  }
}

app.get("/", (req, res) => {
  res.json({
    node:
      "Seminar Room Sensor Simulator",

    status: "running",

    sensors: [
      "seminar-front-01",
      "seminar-middle-01",
      "seminar-rear-01"
    ]
  });
});

app.get(
  "/sensor/current",
  (req, res) => {
    res.json(
      getCurrentState()
    );
  }
);

app.post(
  "/sensor/generate",
  (req, res) => {
    const readings =
      updateSimulation();

    res.json({
      readings
    });
  }
);

app.post(
  "/sensor/send",
  async (req, res) => {
    try {
      const readings =
        updateSimulation();

      const edgeResponse =
        await sendReadingsToEdge(
          readings
        );

      res.json({
        readings,
        edgeResponse
      });
    } catch (error) {
      res.status(502).json({
        error:
          "Failed to send readings to Edge Node",

        details:
          error.message
      });
    }
  }
);

app.post(
  "/sensor/scenario",
  async (req, res) => {
    try {
      const readings =
        setScenario(
          req.body || {}
        );

      const edgeResponse =
        await sendReadingsToEdge(
          readings
        );

      res.json({
        readings,
        edgeResponse
      });
    } catch (error) {
      res.status(502).json({
        error:
          "Failed to send controlled scenario",

        details:
          error.message
      });
    }
  }
);

app.listen(PORT, () => {
  console.log(
    `Sensor Node running on http://localhost:${PORT}`
  );

  console.log(
    "Simulating FRONT, MIDDLE and REAR seminar room sensors"
  );

  console.log(
    `Sensor interval: ${SENSOR_INTERVAL_MS} ms`
  );

  setInterval(
    async () => {
      const readings =
        updateSimulation();

      displayReadings(
        readings
      );

      try {
        const response =
          await sendReadingsToEdge(
            readings
          );

        console.log(
          `Edge decision: ${response.decision.mode}`
        );

        console.log(
          `Fan speed: ${response.decision.fanSpeed}`
        );

        console.log(
          `Ventilation: ${response.decision.ventilation}`
        );

        console.log(
          `Reason: ${response.decision.reason}`
        );
      } catch (error) {
        console.log(
          "Edge Node unavailable:",
          error.message
        );
      }
    },
    SENSOR_INTERVAL_MS
  );
});