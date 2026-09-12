const mongoose =
  require("mongoose");

const hvacRequestSchema =
  new mongoose.Schema(
    {
      sensorId: {
        type: String,
        required: true
      },

      sensorReading: {
        temperature: Number,
        humidity: Number,
        chairsOccupied: Number,
        totalChairs: Number
      },

      requestedConfiguration: {
        mode: String,
        targetTemperature: Number,
        fanSpeed: String,
        ventilation: String
      },

      reason: {
        type: String
      },

      requestStatus: {
        type: String,

        enum: [
          "SUCCESS",
          "FAILED"
        ],

        required: true
      },

      errorMessage: {
        type: String
      },

      timestamp: {
        type: Date,
        default: Date.now
      }
    },

    {
      collection:
        "hvac_requests"
    }
  );

module.exports =
  mongoose.model(
    "HVACRequest",
    hvacRequestSchema
  );