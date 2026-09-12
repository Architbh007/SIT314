const mongoose =
  require("mongoose");

const hvacStatusChangeSchema =
  new mongoose.Schema(
    {
      previousState: {
        mode: String,
        targetTemperature: Number,
        fanSpeed: String,
        ventilation: String,
        lastUpdated: Date
      },

      newState: {
        mode: String,
        targetTemperature: Number,
        fanSpeed: String,
        ventilation: String,
        lastUpdated: Date
      },

      reason: {
        type: String
      },

      triggeredBySensorId: {
        type: String
      },

      timestamp: {
        type: Date,
        default: Date.now
      }
    },

    {
      collection:
        "hvac_status_changes"
    }
  );

module.exports =
  mongoose.model(
    "HVACStatusChange",
    hvacStatusChangeSchema
  );