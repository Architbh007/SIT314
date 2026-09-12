require("dotenv").config();

const express =
  require("express");

const app = express();

const PORT = 3001;

app.use(
  express.json()
);

let currentState = {
  mode: "OFF",

  targetTemperature:
    null,

  fanSpeed: "OFF",

  ventilation:
    "NORMAL",

  lastUpdated:
    new Date().toISOString()
};

app.get("/", (req, res) => {
  res.json({
    node: "HVAC Node",
    status: "running"
  });
});

app.get(
  "/hvac/status",
  (req, res) => {
    res.json(
      currentState
    );
  }
);

app.post(
  "/hvac/config",
  (req, res) => {
    const {
      mode,
      targetTemperature,
      fanSpeed,
      ventilation
    } = req.body;

    const validModes = [
      "OFF",
      "AUTO",
      "COOL",
      "HEAT"
    ];

    const validFanSpeeds = [
      "OFF",
      "LOW",
      "MEDIUM",
      "HIGH"
    ];

    const validVentilation = [
      "NORMAL",
      "INCREASED"
    ];

    if (
      !validModes.includes(mode)
    ) {
      return res
        .status(400)
        .json({
          error:
            "Invalid HVAC mode"
        });
    }

    if (
      !validFanSpeeds.includes(
        fanSpeed
      )
    ) {
      return res
        .status(400)
        .json({
          error:
            "Invalid fan speed"
        });
    }

    if (
      !validVentilation.includes(
        ventilation
      )
    ) {
      return res
        .status(400)
        .json({
          error:
            "Invalid ventilation setting"
        });
    }

    const previousState = {
      ...currentState
    };

    currentState = {
      mode,

      targetTemperature:
        typeof targetTemperature ===
        "number"
          ? targetTemperature
          : null,

      fanSpeed,

      ventilation,

      lastUpdated:
        new Date().toISOString()
    };

    console.log(
      "\nHVAC configuration updated"
    );

    console.log(
      "Previous state:",
      previousState
    );

    console.log(
      "New state:",
      currentState
    );

    res.json({
      message:
        "HVAC configuration updated successfully",

      previousState,

      currentState
    });
  }
);

app.listen(
  PORT,
  () => {
    console.log(
      `HVAC Node running on http://localhost:${PORT}`
    );
  }
);