const net = require("net");

const host = "127.0.0.1";
const port = 6000;
const area = process.argv[2] || "Central";

const client = net.createConnection(port, host, () => {
    console.log("Connected");
    setInterval(() => {
        const rain = Math.floor(Math.random() * 200) + 1;
        client.write(`rain,${area},${rain}`);
    }, 2000); // Interval in milliseconds (2000ms = 2 seconds)
});

client.on("data", (data) => {
    console.log(`Received: ${data}`);
});

client.on("error", (error) => {
    console.log(`Error: ${error.message}`);
});

client.on("close", () => {
    console.log("Connection closed");
});