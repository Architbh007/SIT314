require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const weather = require("weather-js");

const app = express();

const PORT = process.env.PORT || 3000;


// Allows the API to receive JSON data from Postman.
app.use(express.json());


// Sensor reading schema.
const readingSchema = new mongoose.Schema(
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


// Stores the latest temperature reading persistently in MongoDB.
const latestTemperatureSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "latest",
      unique: true
    },

    readingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reading"
    },

    sensorId: {
      type: String
    },

    temperature: {
      type: Number
    },

    humidity: {
      type: Number
    },

    location: {
      type: String
    },

    recordedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);


const Reading = mongoose.model(
  "Reading",
  readingSchema
);

const LatestTemperature = mongoose.model(
  "LatestTemperature",
  latestTemperatureSchema
);


// Finds the newest reading and updates the latest-temperature record.
async function refreshLatestTemperature() {

  const latestReading = await Reading.findOne()
    .sort({
      recordedAt: -1,
      createdAt: -1
    });


  if (!latestReading) {

    await LatestTemperature.deleteMany({});

    return null;
  }


  const latest =
    await LatestTemperature.findOneAndUpdate(
      {
        key: "latest"
      },

      {
        key: "latest",

        readingId:
          latestReading._id,

        sensorId:
          latestReading.sensorId,

        temperature:
          latestReading.temperature,

        humidity:
          latestReading.humidity,

        location:
          latestReading.location,

        recordedAt:
          latestReading.recordedAt
      },

      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );


  return latest;
}


// Root endpoint.
app.get("/", (req, res) => {

  res.status(200).json({

    message:
      "Local Weather Web Service is running",

    endpoints: {

      create:
        "POST /api/readings",

      readAll:
        "GET /api/readings",

      readLatest:
        "GET /api/readings/latest",

      readOne:
        "GET /api/readings/:id",

      update:
        "PUT /api/readings/:id",

      delete:
        "DELETE /api/readings/:id",

      locationWeather:
        "GET /api/weather/location?search=Melbourne"
    }

  });

});


// Create a sensor reading.
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
        !location
      ) {

        return res.status(400).json({

          success: false,

          error:
            "sensorId, temperature and location are required."

        });

      }


      const newReading = new Reading({

        sensorId,

        temperature,

        humidity,

        location,

        recordedAt:
          recordedAt || new Date()

      });


      const savedReading =
        await newReading.save();


      await refreshLatestTemperature();


      return res.status(201).json({

        success: true,

        message:
          "Sensor reading created successfully.",

        reading:
          savedReading

      });

    } catch (error) {

      console.error(
        "CREATE error:",
        error
      );


      return res.status(500).json({

        success: false,

        error:
          "Unable to create sensor reading.",

        details:
          error.message

      });

    }

  }
);


// Read all sensor readings.
app.get(
  "/api/readings",

  async (req, res) => {

    try {

      const readings =
        await Reading.find()
          .sort({
            recordedAt: -1
          });


      return res.status(200).json({

        success: true,

        count:
          readings.length,

        readings

      });

    } catch (error) {

      console.error(
        "READ ALL error:",
        error
      );


      return res.status(500).json({

        success: false,

        error:
          "Unable to retrieve sensor readings.",

        details:
          error.message

      });

    }

  }
);


// Read the latest temperature.
app.get(
  "/api/readings/latest",

  async (req, res) => {

    try {

      let latest =
        await LatestTemperature.findOne({
          key: "latest"
        });


      if (!latest) {

        latest =
          await refreshLatestTemperature();

      }


      if (!latest) {

        return res.status(404).json({

          success: false,

          message:
            "No temperature readings are currently available."

        });

      }


      return res.status(200).json({

        success: true,

        message:
          "Latest temperature reading retrieved successfully.",

        latest

      });

    } catch (error) {

      console.error(
        "LATEST error:",
        error
      );


      return res.status(500).json({

        success: false,

        error:
          "Unable to retrieve latest temperature.",

        details:
          error.message

      });

    }

  }
);


// Read one sensor reading.
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

          error:
            "Invalid sensor reading ID."

        });

      }


      const reading =
        await Reading.findById(
          readingId
        );


      if (!reading) {

        return res.status(404).json({

          success: false,

          error:
            "Sensor reading not found."

        });

      }


      return res.status(200).json({

        success: true,

        reading

      });

    } catch (error) {

      console.error(
        "READ ONE error:",
        error
      );


      return res.status(500).json({

        success: false,

        error:
          "Unable to retrieve sensor reading.",

        details:
          error.message

      });

    }

  }
);


// Update a sensor reading.
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
        Object.keys(updates).length === 0
      ) {

        return res.status(400).json({

          success: false,

          error:
            "No valid fields were provided to update."

        });

      }


      const updatedReading =
        await Reading.findByIdAndUpdate(
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

          error:
            "Sensor reading not found."

        });

      }


      await refreshLatestTemperature();


      return res.status(200).json({

        success: true,

        message:
          "Sensor reading updated successfully.",

        reading:
          updatedReading

      });

    } catch (error) {

      console.error(
        "UPDATE error:",
        error
      );


      return res.status(500).json({

        success: false,

        error:
          "Unable to update sensor reading.",

        details:
          error.message

      });

    }

  }
);


// Delete a sensor reading.
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

          error:
            "Invalid sensor reading ID."

        });

      }


      const deletedReading =
        await Reading.findByIdAndDelete(
          readingId
        );


      if (!deletedReading) {

        return res.status(404).json({

          success: false,

          error:
            "Sensor reading not found."

        });

      }


      await refreshLatestTemperature();


      return res.status(200).json({

        success: true,

        message:
          "Sensor reading deleted successfully.",

        deletedReading

      });

    } catch (error) {

      console.error(
        "DELETE error:",
        error
      );


      return res.status(500).json({

        success: false,

        error:
          "Unable to delete sensor reading.",

        details:
          error.message

      });

    }

  }
);


// Retrieve weather for a specific location using weather-js.
app.get(
  "/api/weather/location",

  (req, res) => {

    const searchLocation =
      req.query.search;


    if (!searchLocation) {

      return res.status(400).json({

        success: false,

        error:
          "Please provide a location.",

        example:
          "/api/weather/location?search=Melbourne"

      });

    }


    weather.find(
      {
        search:
          searchLocation,

        degreeType:
          "C"
      },

      (error, result) => {

        if (error) {

          console.error(
            "weather-js error:",
            error
          );


          return res.status(500).json({

            success: false,

            error:
              "Unable to retrieve weather information.",

            details:
              String(error)

          });

        }


        if (
          !result ||
          result.length === 0
        ) {

          return res.status(404).json({

            success: false,

            error:
              "No weather information was found for the requested location."

          });

        }


        const weatherData =
          result[0];


        return res.status(200).json({

          success: true,

          source:
            "weather-js",

          requestedLocation:
            searchLocation,

          location:
            weatherData.location,

          current:
            weatherData.current,

          forecast:
            weatherData.forecast

        });

      }

    );

  }
);


// Handle invalid endpoints.
app.use(
  (req, res) => {

    return res.status(404).json({

      success: false,

      error:
        "Endpoint not found."

    });

  }
);


// Connect to MongoDB and start the API server.
async function startServer() {

  try {

    if (!process.env.MONGODB_URI) {

      throw new Error(
        "MONGODB_URI has not been configured in the .env file."
      );

    }


    await mongoose.connect(
      process.env.MONGODB_URI
    );


    console.log(
      "MongoDB connected successfully."
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `API: http://localhost:${PORT}/api/readings`
    );


    app.listen(
      PORT,
      () => {

        console.log(
          `Weather service listening on port ${PORT}.`
        );

      }
    );

  } catch (error) {

    console.error(
      "Unable to start weather service."
    );

    console.error(
      error.message
    );


    process.exit(1);

  }

}


startServer();