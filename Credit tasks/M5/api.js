require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const os = require("os");

const app = express();

const PORT = process.env.PORT || 3000;

const INSTANCE_NAME =
  process.env.INSTANCE_NAME ||
  os.hostname();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader(
    "X-Instance-Name",
    INSTANCE_NAME
  );

  next();
});


const sensorReadingSchema =
  new mongoose.Schema(
    {
      sensorId: {
        type: String,
        required: true,
        trim: true
      },

      temperature: {
        type: Number,
        required: true
      },

      humidity: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },

      location: {
        type: String,
        required: true,
        trim: true
      },

      recordedAt: {
        type: Date,
        default: Date.now
      }
    },
    {
      timestamps: true
    }
  );


const SensorReading =
  mongoose.model(
    "SensorReading",
    sensorReadingSchema
  );


app.get(
  "/",
  (req, res) => {

    res.status(200).json({
      message:
        "Module 5 Load-Balanced Sensor API",

      status:
        "running",

      handledBy:
        INSTANCE_NAME,

      endpoints: {
        health:
          "GET /health",

        instance:
          "GET /api/instance",

        create:
          "POST /api/readings",

        readAll:
          "GET /api/readings",

        readOne:
          "GET /api/readings/:id",

        update:
          "PUT /api/readings/:id",

        delete:
          "DELETE /api/readings/:id"
      }
    });

  }
);


app.get(
  "/health",
  (req, res) => {

    res.status(200).json({
      status:
        "healthy",

      instance:
        INSTANCE_NAME,

      hostname:
        os.hostname(),

      database:
        mongoose.connection.readyState === 1
          ? "connected"
          : "disconnected"
    });

  }
);


app.get(
  "/api/instance",
  (req, res) => {

    res.status(200).json({
      message:
        "Request handled successfully.",

      instance:
        INSTANCE_NAME,

      hostname:
        os.hostname(),

      timestamp:
        new Date().toISOString()
    });

  }
);


app.post(
  "/api/readings",
  async (req, res) => {

    try {

      const {
        sensorId,
        temperature,
        humidity,
        location,
        recordedAt
      } = req.body;


      if (
        !sensorId ||
        temperature === undefined ||
        humidity === undefined ||
        !location
      ) {

        return res.status(400).json({
          success: false,

          handledBy:
            INSTANCE_NAME,

          error:
            "sensorId, temperature, humidity and location are required."
        });

      }


      const reading =
        new SensorReading({
          sensorId,
          temperature,
          humidity,
          location,
          recordedAt:
            recordedAt || new Date()
        });


      const savedReading =
        await reading.save();


      return res.status(201).json({
        success: true,

        handledBy:
          INSTANCE_NAME,

        message:
          "Sensor reading created successfully.",

        reading:
          savedReading
      });

    } catch (error) {

      console.error(
        "Create error:",
        error.message
      );


      return res.status(500).json({
        success: false,

        handledBy:
          INSTANCE_NAME,

        error:
          "Unable to create sensor reading.",

        details:
          error.message
      });

    }

  }
);


app.get(
  "/api/readings",
  async (req, res) => {

    try {

      const readings =
        await SensorReading.find()
          .sort({
            recordedAt: -1
          });


      return res.status(200).json({
        success: true,

        handledBy:
          INSTANCE_NAME,

        count:
          readings.length,

        readings
      });

    } catch (error) {

      console.error(
        "Read error:",
        error.message
      );


      return res.status(500).json({
        success: false,

        handledBy:
          INSTANCE_NAME,

        error:
          "Unable to retrieve sensor readings.",

        details:
          error.message
      });

    }

  }
);


app.get(
  "/api/readings/:id",
  async (req, res) => {

    try {

      const readingId =
        req.params.id;


      if (
        !mongoose.isValidObjectId(
          readingId
        )
      ) {

        return res.status(400).json({
          success: false,

          handledBy:
            INSTANCE_NAME,

          error:
            "Invalid sensor reading ID."
        });

      }


      const reading =
        await SensorReading.findById(
          readingId
        );


      if (!reading) {

        return res.status(404).json({
          success: false,

          handledBy:
            INSTANCE_NAME,

          error:
            "Sensor reading not found."
        });

      }


      return res.status(200).json({
        success: true,

        handledBy:
          INSTANCE_NAME,

        reading
      });

    } catch (error) {

      console.error(
        "Read one error:",
        error.message
      );


      return res.status(500).json({
        success: false,

        handledBy:
          INSTANCE_NAME,

        error:
          "Unable to retrieve sensor reading.",

        details:
          error.message
      });

    }

  }
);


app.put(
  "/api/readings/:id",
  async (req, res) => {

    try {

      const readingId =
        req.params.id;


      if (
        !mongoose.isValidObjectId(
          readingId
        )
      ) {

        return res.status(400).json({
          success: false,

          handledBy:
            INSTANCE_NAME,

          error:
            "Invalid sensor reading ID."
        });

      }


      const allowedFields = [
        "sensorId",
        "temperature",
        "humidity",
        "location",
        "recordedAt"
      ];


      const updates = {};


      for (
        const field of allowedFields
      ) {

        if (
          req.body[field] !==
          undefined
        ) {

          updates[field] =
            req.body[field];

        }

      }


      if (
        Object.keys(
          updates
        ).length === 0
      ) {

        return res.status(400).json({
          success: false,

          handledBy:
            INSTANCE_NAME,

          error:
            "No valid fields were provided to update."
        });

      }


      const updatedReading =
        await SensorReading
          .findByIdAndUpdate(
            readingId,
            updates,
            {
              new: true,
              runValidators: true
            }
          );


      if (!updatedReading) {

        return res.status(404).json({
          success: false,

          handledBy:
            INSTANCE_NAME,

          error:
            "Sensor reading not found."
        });

      }


      return res.status(200).json({
        success: true,

        handledBy:
          INSTANCE_NAME,

        message:
          "Sensor reading updated successfully.",

        reading:
          updatedReading
      });

    } catch (error) {

      console.error(
        "Update error:",
        error.message
      );


      return res.status(500).json({
        success: false,

        handledBy:
          INSTANCE_NAME,

        error:
          "Unable to update sensor reading.",

        details:
          error.message
      });

    }

  }
);


app.delete(
  "/api/readings/:id",
  async (req, res) => {

    try {

      const readingId =
        req.params.id;


      if (
        !mongoose.isValidObjectId(
          readingId
        )
      ) {

        return res.status(400).json({
          success: false,

          handledBy:
            INSTANCE_NAME,

          error:
            "Invalid sensor reading ID."
        });

      }


      const deletedReading =
        await SensorReading
          .findByIdAndDelete(
            readingId
          );


      if (!deletedReading) {

        return res.status(404).json({
          success: false,

          handledBy:
            INSTANCE_NAME,

          error:
            "Sensor reading not found."
        });

      }


      return res.status(200).json({
        success: true,

        handledBy:
          INSTANCE_NAME,

        message:
          "Sensor reading deleted successfully.",

        deletedReading
      });

    } catch (error) {

      console.error(
        "Delete error:",
        error.message
      );


      return res.status(500).json({
        success: false,

        handledBy:
          INSTANCE_NAME,

        error:
          "Unable to delete sensor reading.",

        details:
          error.message
      });

    }

  }
);


app.use(
  (req, res) => {

    return res.status(404).json({
      success: false,

      handledBy:
        INSTANCE_NAME,

      error:
        "Endpoint not found."
    });

  }
);


async function startServer() {

  try {

    if (!process.env.MONGODB_URI) {

      throw new Error(
        "MONGODB_URI is missing from the .env file."
      );

    }


    await mongoose.connect(
      process.env.MONGODB_URI
    );


    console.log(
      "MongoDB connected successfully."
    );

    console.log(
      `Instance: ${INSTANCE_NAME}`
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Health: http://localhost:${PORT}/health`
    );


    app.listen(
      PORT,
      () => {

        console.log(
          `Sensor API listening on port ${PORT}.`
        );

      }
    );

  } catch (error) {

    console.error(
      "Unable to start API:"
    );

    console.error(
      error.message
    );


    process.exit(1);

  }

}


startServer();