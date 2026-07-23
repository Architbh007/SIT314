const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://3.122.117.78:1883");

const alertTopic = "test_archit/forest_fire/alerts/#";

client.on("connect", () => {
    console.log("Connected to MQTT broker");

    client.subscribe(alertTopic, (error) => {
        if (error) {
            console.error("Subscription failed:", error.message);
            return;
        }

        console.log("Waiting for forest fire alerts...");
    });
});

client.on("message", (topic, message) => {

    if (topic.includes("homeowners")) {
        console.log("HOMEOWNER ALERT");
    }

    if (topic.includes("fire_service")) {
        console.log("FIRE SERVICE ALERT");
    }

    if (topic.includes("news")) {
        console.log("NEWS ORGANISATION ALERT");
    }

    if (topic.includes("social_media")) {
        console.log("SOCIAL MEDIA NOTIFICATION");
    }

    console.log(message.toString());
});

client.on("error", (error) => {
    console.error("MQTT error:", error.message);
});