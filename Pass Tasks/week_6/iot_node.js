const express = require('express');
const app = express();

const port = 3001;

app.get('/lightOn', function (req, res) {
    console.log("Switching Light On");
    res.send("Light is now ON");
});

app.get('/lightOff', function (req, res) {
    console.log("Switching Light Off");
    res.send("Light is now OFF");
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});

