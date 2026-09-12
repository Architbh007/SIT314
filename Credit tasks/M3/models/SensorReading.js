const mongoose =
  require("mongoose");

const sensorReadingSchema =
  new mongoose.Schema(
    {
      sensorId: {
        type: String,
        required: true
      },

      zone: {
        type: String,
        required: true
      },

      timestamp: {
        type: Date,
        required: true
      },

      temperature: {
        type: Number,
        required: true
      },

      humidity: {
        type: Number,
        required: true
      },

      chairsOccupied: {
        type: Number,
        required: true
      },

      totalChairs: {
        type: Number,
        required: true
      }
    },

    {
      collection:
        "sensor_readings"
    }
  );

module.exports =
  mongoose.model(
    "SensorReading",
    sensorReadingSchema
  );
