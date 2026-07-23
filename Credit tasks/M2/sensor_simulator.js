const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://3.122.117.78:1883");

const topic = "test_archit/forest_fire/sensor_data";

function generateRandomValue(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSensorData() {
    return {
        temperature: generateRandomValue(20, 80),
        surfaceHeat: generateRandomValue(25, 100),
        smoke: generateRandomValue(0, 100),
        carbonMonoxide: generateRandomValue(0, 100),
        flameDetected: Math.random() < 0.25,
        timestamp: new Date().toISOString()
    };
}

client.on("connect", () => {
    console.log("Connected to MQTT broker");
    console.log("Publishing random forest sensor readings...\n");

    setInterval(() => {
        const sensorData = generateSensorData();

        client.publish(
            topic,
            JSON.stringify(sensorData)
        );

        console.log("Temperature:", sensorData.temperature + "°C");
        console.log("Surface heat:", sensorData.surfaceHeat + "°C");
        console.log("Smoke level:", sensorData.smoke);
        console.log("Carbon monoxide:", sensorData.carbonMonoxide);
        console.log("Flame detected:", sensorData.flameDetected);
    }, 3000);
});

client.on("error", (error) => {
    console.error("MQTT error:", error.message);
});