const mqtt = require('mqtt');

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

var topic = "test_archit";
var message = "Hiiieee";

client.on('connect', () =>
{
    console.log('mqtt connected');

    client.publish(topic, message);

    console.log(
        'published to Topic: ' +
        topic +
        ' with Message: ' +
        message
    );
});