const COOLING_START = 26;
const COOLING_STOP = 24;

const HEATING_START = 19;
const HEATING_STOP = 21;

const HIGH_HUMIDITY = 65;

function determineFanSpeed(
  chairsOccupied,
  humidity
) {
  if (chairsOccupied === 0) {
    return "OFF";
  }

  let fanSpeed;

  if (chairsOccupied <= 10) {
    fanSpeed = "LOW";
  } else if (
    chairsOccupied <= 20
  ) {
    fanSpeed = "MEDIUM";
  } else {
    fanSpeed = "HIGH";
  }

  if (
    humidity > HIGH_HUMIDITY
  ) {
    if (
      fanSpeed === "LOW"
    ) {
      fanSpeed = "MEDIUM";
    } else if (
      fanSpeed === "MEDIUM"
    ) {
      fanSpeed = "HIGH";
    }
  }

  return fanSpeed;
}

function makeDecision(
  reading,
  currentHVACState
) {
  const {
    temperature,
    humidity,
    chairsOccupied
  } = reading;

  if (
    chairsOccupied === 0
  ) {
    return {
      mode: "OFF",

      targetTemperature:
        null,

      fanSpeed: "OFF",

      ventilation:
        "NORMAL",

      reason:
        "No occupants detected, so HVAC is disabled to avoid unnecessary energy use."
    };
  }

  const fanSpeed =
    determineFanSpeed(
      chairsOccupied,
      humidity
    );

  const ventilation =
    humidity >
    HIGH_HUMIDITY
      ? "INCREASED"
      : "NORMAL";

  /*
   * Cooling hysteresis prevents rapid switching when the
   * room temperature fluctuates near the cooling threshold.
   */
  if (
    currentHVACState.mode ===
    "COOL"
  ) {
    if (
      temperature >
      COOLING_STOP
    ) {
      return {
        mode: "COOL",

        targetTemperature:
          22,

        fanSpeed,

        ventilation,

        reason:
          "Cooling remains active until the room reaches the cooling stop threshold."
      };
    }
  }

  /*
   * Heating hysteresis uses a different stop threshold
   * to reduce unnecessary HVAC state changes.
   */
  if (
    currentHVACState.mode ===
    "HEAT"
  ) {
    if (
      temperature <
      HEATING_STOP
    ) {
      return {
        mode: "HEAT",

        targetTemperature:
          22,

        fanSpeed,

        ventilation,

        reason:
          "Heating remains active until the room reaches the heating stop threshold."
      };
    }
  }

  if (
    temperature >=
    COOLING_START
  ) {
    return {
      mode: "COOL",

      targetTemperature:
        22,

      fanSpeed,

      ventilation,

      reason:
        "Room temperature is above the cooling threshold."
    };
  }

  if (
    temperature <=
    HEATING_START
  ) {
    return {
      mode: "HEAT",

      targetTemperature:
        22,

      fanSpeed,

      ventilation,

      reason:
        "Room temperature is below the heating threshold."
    };
  }

  if (
    humidity >
    HIGH_HUMIDITY
  ) {
    return {
      mode: "AUTO",

      targetTemperature:
        23,

      fanSpeed,

      ventilation,

      reason:
        "Temperature is comfortable, but humidity is high so ventilation has been increased."
    };
  }

  return {
    mode: "AUTO",

    targetTemperature:
      23,

    fanSpeed,

    ventilation,

    reason:
      "Room conditions are comfortable, so low-energy automatic control is being used."
  };
}

module.exports = {
  makeDecision
};