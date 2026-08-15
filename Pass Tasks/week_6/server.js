const express = require('express');
const app = express();

const port = 3000;
const base = `${__dirname}/web`;

app.use(express.static('web'));

app.get('/', function (req, res) {
  res.send('hello world');
});

app.get('/welcome', function (req, res) {
  res.sendFile(`${base}/welcome.html`);
});

app.get('/secret', function (req, res) {
  res.send('This area is secret, you have been reported');
  console.log("Alert! Alert! Security Violation!!!");
});

app.get('/sensorData', function (req, res) {
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
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(sensordata));
});

app.get('*wild', (req, res) => {
  res.sendFile(`${base}/404.html`);
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});