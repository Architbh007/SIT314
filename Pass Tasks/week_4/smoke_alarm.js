const mqtt = require("mqtt");

const brokerUrl = "mqtt://3.122.117.78:1883";
const topic = "test_archit/smoke_alarm";

const client = mqtt.connect(brokerUrl, {
    clientId: `test_archit_alarm_${Date.now()}`,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 10000
});

client.on("connect", () => {
    console.log("Smoke alarm connected to the MQTT broker.");

    client.subscribe(topic, { qos: 0 }, (error) => {
        if (error) {
            console.error("Subscription failed:", error.message);
            return;
        }

        console.log(`Subscribed to: ${topic}`);
        console.log("Waiting for smoke alarm messages...");
    });
});

client.on("message", (receivedTopic, message) => {
    console.log(`Topic: ${receivedTopic}`);
    console.log(`Smoke Alert: ${message.toString()}`);
});

client.on("reconnect", () => {
    console.log("Smoke alarm attempting to reconnect...");
});

client.on("error", (error) => {
    console.error("Smoke alarm MQTT error:", error.message);
});