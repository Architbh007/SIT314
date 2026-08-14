const mongoose = require('mongoose');

mongoose.connect('hihi');

const Sensor = require('./models/sensor');

setInterval(sensortest, 1000); // runs every 1000ms

function sensortest() {
    const time1 = Date.now();

    const sensordata = {
        id: 0,
        name: "temperaturesensor",
        address: "221 Burwood Hwy, Burwood VIC 3125",
        time: Date.now(),
        temperature: 20
    };

    const low = 10;
    const high = 40;
    const reading = Math.floor(Math.random() * (high - low) + low);
    sensordata.temperature = reading;

    const jsonString = JSON.stringify(sensordata);
    console.log(jsonString);

    const newSensor = new Sensor({
        id: sensordata.id,
        name: sensordata.name,
        address: sensordata.address,
        time: sensordata.time,
        temperature: sensordata.temperature
    });

    newSensor.save().then(doc => {
        const time2 = Date.now();
        console.log("Time taken (ms):", time2 - time1);
        console.log(doc);
    });
}
