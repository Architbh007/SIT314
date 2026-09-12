const net = require("net");
const { generateWind } = require("./climate_model");

const host = "127.0.0.1";
const port = 6000;
const area = process.argv[2] || "Central";

const client = net.createConnection(port, host, () => {
    console.log("Connected");
    setInterval(() => {
        const wind = generateWind(area, new Date());
        client.write(`wind,${area},${wind}\n`);
    }, 2000);
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