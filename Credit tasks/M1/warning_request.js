const net = require("net");

const host = "127.0.0.1";
const port = 6000;
const area = process.argv[2] || "Central";

const client = net.createConnection(port, host, () => {
    console.log("Connected");
    setInterval(() => {
        client.write(`request,${area}\n`);
    }, 2000);
});

client.on("data", (data) => {
    console.log(`Received: ${data}`);
    // process.exit(0);
});

client.on("error", (error) => {
    console.log(`Error: ${error.message}`);
});

client.on("close", () => {
    console.log("Connection closed");
});