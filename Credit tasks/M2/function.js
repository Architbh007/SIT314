const data = msg.payload;

// Check which sensors are reporting dangerous values
const temperatureDanger = data.temperature >= 45;
const surfaceHeatDanger = data.surfaceHeat >= 65;
const smokeDanger = data.smoke >= 60;
const carbonMonoxideDanger = data.carbonMonoxide >= 50;
const flameDanger = data.flameDetected === true;

// Count the number of dangerous sensors
const dangerousSensorCount = [
    temperatureDanger,
    surfaceHeatDanger,
    smokeDanger,
    carbonMonoxideDanger,
    flameDanger
].filter(Boolean).length;

let alertLevel = 0;

// Level 3: at least four dangerous sensors, including flame
if (dangerousSensorCount >= 4 && flameDanger) {
    alertLevel = 3;
}
// Level 2: at least three dangerous sensors,
// or two dangerous sensors where flame is detected
else if (
    dangerousSensorCount >= 3 ||
    (dangerousSensorCount >= 2 && flameDanger)
) {
    alertLevel = 2;
}
// Level 1: at least two dangerous sensors
else if (dangerousSensorCount >= 2) {
    alertLevel = 1;
}

// No alert when zero or one sensor is dangerous
if (alertLevel === 0) {
    node.status({
        fill: "green",
        shape: "dot",
        text: dangerousSensorCount + " dangerous sensor - no alert"
    });

    return [null, null, null, null];
}

const readingSummary =
    "\nTemperature: " + data.temperature + "°C" +
    "\nSurface heat: " + data.surfaceHeat + "°C" +
    "\nSmoke level: " + data.smoke +
    "\nCarbon monoxide: " + data.carbonMonoxide +
    "\nFlame detected: " + data.flameDetected +
    "\nDangerous sensors: " + dangerousSensorCount;

// Homeowners receive Level 1, Level 2 and Level 3 alerts
let homeownerMessage = {
    payload:
        "LOCAL FOREST FIRE WARNING" +
        "\nMultiple sensors have detected dangerous conditions." +
        "\nResidents should remain alert and follow emergency instructions." +
        readingSummary
};

// Fire service receives Level 2 and Level 3 alerts
let fireServiceMessage = null;

if (alertLevel >= 2) {
    fireServiceMessage = {
        payload:
            "FIRE SERVICE EMERGENCY ALERT" +
            "\nMultiple forest sensors have detected possible fire conditions." +
            "\nImmediate investigation is required." +
            readingSummary
    };
}

// News and social media only receive confirmed Level 3 alerts
let newsMessage = null;
let socialMediaMessage = null;

if (alertLevel === 3) {
    newsMessage = {
        payload:
            "CONFIRMED FOREST FIRE NOTIFICATION" +
            "\nCritical heat, smoke and flame conditions have been confirmed." +
            "\nEmergency services have been alerted." +
            readingSummary
    };

    socialMediaMessage = {
        payload:
            "PUBLIC SAFETY ALERT: A forest fire has been confirmed. " +
            "Avoid the affected area and follow official emergency instructions."
    };
}

node.status({
    fill: "red",
    shape: "dot",
    text: "Alert Level " + alertLevel
});

return [
    homeownerMessage,
    fireServiceMessage,
    newsMessage,
    socialMediaMessage
];