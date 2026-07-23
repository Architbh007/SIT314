const mqtt = require("mqtt");

const brokerUrl = "mqtt://3.122.117.78:1883";
const topic = "test_archit/smoke_detector";

let smokeLevel = 0;

const client = mqtt.connect(brokerUrl, {
    clientId: `test_archit_detector_${Date.now()}`,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 10000
});

client.on("connect", () => {
    console.log("Smoke detector connected to the MQTT broker.");
    console.log(`Publishing smoke values to: ${topic}`);

    setInterval(() => {
        const message = smokeLevel.toString();

        client.publish(topic, message, { qos: 0 }, (error) => {
            if (error) {
                console.error("Publishing failed:", error.message);
                return;
            }

            console.log(`Published smoke level: ${message}`);
        });

        smokeLevel++;
    }, 1000);
});

client.on("reconnect", () => {
    console.log("Smoke detector attempting to reconnect...");
});

client.on("error", (error) => {
    console.error("Smoke detector MQTT error:", error.message);
});