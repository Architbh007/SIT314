const mqtt = require('mqtt');

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

var topic = "test_archit";

client.on('connect', () =>
{
    client.subscribe(topic);

    console.log('subscribed to Topic: ' + topic);
});

client.on('message', (topic, message) =>
{
    console.log('Topic is: ' + topic);
    console.log('Message is: ' + message.toString());
});