const API_URL =
  process.env.API_URL ||
  "http://localhost:3000";


function generateSensorReading() {

  return {
    sensorId:
      "SENSOR_001",

    temperature:
      Number(
        (
          18 +
          Math.random() * 15
        ).toFixed(1)
      ),

    humidity:
      Math.floor(
        40 +
        Math.random() * 40
      ),

    location:
      "Melbourne",

    recordedAt:
      new Date().toISOString()
  };

}


async function sendSensorReading() {

  const reading =
    generateSensorReading();


  try {

    const response =
      await fetch(
        `${API_URL}/api/readings`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              reading
            )
        }
      );


    const result =
      await response.json();


    console.log(
      "Sensor reading sent:"
    );

    console.log(
      reading
    );


    console.log(
      "Handled by:",
      result.handledBy
    );


    console.log(
      "Status:",
      response.status
    );


    console.log("");

  } catch (error) {

    console.error(
      "Unable to send sensor reading:",
      error.message
    );

  }

}


console.log(
  `Sending sensor data to ${API_URL}`
);


sendSensorReading();


setInterval(
  sendSensorReading,
  3000
);