# Forest Fire Monitoring and Alarm System — Design Specification

## 1. Project Overview

This project is a prototype forest fire monitoring and alarm system implemented using **Node.js, MQTT and Node-RED**. The system will simulate five monitoring stations positioned across a forest zone. Each station will collect several measurements associated with heat, smoke and active fire.

The system is designed to avoid false alarms. One unusual sensor reading will not generate an alert, and one monitoring station alone will not notify external stakeholders. Node-RED will compare recent readings from multiple stations before deciding whether a warning or emergency alert should be sent.

## 2. Main Objectives

The prototype must:

- Use at least five sensor types associated with heat, smoke and fire detection.
- Use multiple monitoring stations distributed across the forest.
- Publish simulated sensor readings using Node.js and MQTT.
- Process and compare the readings using Node-RED.
- Prevent one sensor or one station from creating an external alert.
- Send different messages to local homeowners, the fire service, news organisations and social media services.
- Escalate alerts according to the severity and confirmation level of the detected conditions.
- Avoid repeatedly sending the same alert while the system remains at the same alert level.

## 3. System Architecture

```text
Five Forest Monitoring Stations
            |
            | MQTT telemetry
            v
       Public MQTT Broker
            |
            v
     Node-RED Processing Flow
            |
            |-- Validate and store readings
            |-- Compare multiple sensor types
            |-- Compare multiple stations
            |-- Determine alert level
            v
  Stakeholder-Specific MQTT Alerts
            |
            |-- Local homeowners
            |-- Fire service
            |-- News organisations
            |-- Social media services
```

## 4. Forest Monitoring Stations

The system will simulate five monitoring stations:

```text
station_1
station_2
station_3
station_4
station_5
```

Each station represents a different physical location within `forest_zone_a`. Every station will publish one combined JSON message containing the latest reading from all five sensor types.

## 5. Sensors Used at Each Station

| Sensor | Example physical device | Measurement | Purpose |
|---|---|---|---|
| Ambient temperature sensor | DHT22 or BME280 | Air temperature in °C | Detects unusually high environmental temperature |
| Infrared surface-temperature sensor | MLX90614 | Vegetation or ground temperature in °C | Detects concentrated heat before the surrounding air becomes extremely hot |
| Smoke sensor | MQ-2 | Simulated smoke level from 0–100 | Detects smoke and combustible gases associated with fire |
| Carbon-monoxide sensor | MQ-7 | Simulated CO level from 0–100 | Detects combustion gases that may indicate smouldering vegetation |
| Infrared flame sensor | IR flame-detection module | Boolean `true` or `false` | Provides direct evidence of visible or infrared flame activity |

For the prototype, these devices will be simulated by Node.js scripts. The data structure will still represent measurements that could later be collected from physical sensors connected to an Arduino, Raspberry Pi or another edge device.

## 6. Sensor Telemetry Format

Each station will publish a JSON message in the following structure:

```json
{
  "stationId": "station_1",
  "zone": "forest_zone_a",
  "ambientTemperature": 48,
  "surfaceTemperature": 71,
  "smokeLevel": 68,
  "carbonMonoxide": 56,
  "flameDetected": false,
  "timestamp": "2026-07-23T10:00:00.000Z"
}
```

## 7. MQTT Topic Design

### 7.1 Station telemetry topics

```text
forest_fire/stations/station_1/telemetry
forest_fire/stations/station_2/telemetry
forest_fire/stations/station_3/telemetry
forest_fire/stations/station_4/telemetry
forest_fire/stations/station_5/telemetry
```

Node-RED will subscribe to all station messages using the wildcard topic:

```text
forest_fire/stations/+/telemetry
```

### 7.2 Stakeholder alert topics

```text
forest_fire/alerts/homeowners
forest_fire/alerts/fire_service
forest_fire/alerts/news
forest_fire/alerts/social_media
forest_fire/alerts/all_clear
```

### 7.3 System status topic

```text
forest_fire/system/status
```

This topic may be used to publish the current system state, such as `NORMAL`, `LOCAL_WARNING`, `FIRE_EMERGENCY`, `CONFIRMED_FIRE` or `ALL_CLEAR`.

## 8. Individual Measurement Thresholds

Two threshold ranges will be used: **warning** and **critical**.

| Measurement | Warning threshold | Critical threshold |
|---|---:|---:|
| Ambient temperature | `>= 45°C` | `>= 55°C` |
| Surface temperature | `>= 65°C` | `>= 80°C` |
| Smoke level | `>= 60/100` | `>= 80/100` |
| Carbon monoxide | `>= 50/100` | `>= 75/100` |
| Flame detection | `true` | `true` |

These are prototype thresholds used to demonstrate the alert logic. They are not intended to replace thresholds defined by emergency services or calibrated physical sensor manufacturers.

## 9. Evidence Groups Used by the Decision Engine

To prevent two similar measurements from being treated as complete fire confirmation, the sensor readings are grouped into three independent evidence categories.

### 9.1 Heat evidence

Heat evidence is present when either of the following is true:

```text
ambientTemperature >= 45°C
OR
surfaceTemperature >= 65°C
```

Critical heat evidence is present when either of the following is true:

```text
ambientTemperature >= 55°C
OR
surfaceTemperature >= 80°C
```

### 9.2 Smoke and combustion evidence

Smoke or combustion evidence is present when either of the following is true:

```text
smokeLevel >= 60
OR
carbonMonoxide >= 50
```

Critical smoke or combustion evidence is present when either of the following is true:

```text
smokeLevel >= 80
OR
carbonMonoxide >= 75
```

### 9.3 Flame evidence

Flame evidence is present when:

```text
flameDetected == true
```

## 10. Station-Level Classification Rules

A single sensor measurement cannot classify a station as dangerous.

### 10.1 Normal station

A station is `NORMAL` when fewer than two independent evidence groups are active.

Examples:

- High ambient temperature only.
- Smoke reading above the warning threshold only.
- One isolated flame reading without supporting heat or smoke evidence.

### 10.2 High-risk station

A station is `HIGH_RISK` when at least two of the following evidence groups are active:

1. Heat evidence
2. Smoke or combustion evidence
3. Flame evidence

Examples:

- High heat and high smoke.
- High heat and flame detection.
- High smoke and flame detection.

### 10.3 Critical station

A station is `CRITICAL` when at least two critical evidence groups are active, and at least one of them is either critical heat or critical smoke/combustion evidence.

Typical critical confirmation would include:

```text
critical heat + critical smoke
```

or:

```text
critical heat + flame
```

or:

```text
critical smoke + flame
```

## 11. Multi-Station Confirmation Rules

Node-RED will store the most recent valid reading from each station. Only readings received within the previous **30 seconds** will be included in the alert decision.

A station reading older than **45 seconds** will be classified as stale and excluded from the decision. This prevents an old dangerous reading from continuing to influence the system after a station stops sending data.

The central safety rule is:

> No external stakeholder alert will be generated from only one sensor measurement or only one monitoring station.

At least two separate stations must provide supporting evidence before the first alert level is activated.

## 12. System Alert Levels

### 12.1 Level 0 — Normal

#### Conditions

```text
Fewer than 2 stations are HIGH_RISK
```

#### Stakeholders alerted

None.

#### System action

- Continue monitoring.
- Display telemetry and station classifications in Node-RED.
- Publish `NORMAL` to the system status topic when the status changes back to normal.

---

### 12.2 Level 1 — Local Fire Warning

#### Conditions

```text
At least 2 stations are HIGH_RISK within the 30-second comparison window
AND
Level 2 or Level 3 conditions are not satisfied
```

This level will normally represent multiple stations detecting elevated heat and smoke without enough evidence to confirm an active fire.

#### Stakeholders alerted

- Local homeowners

#### Homeowner message

```text
LOCAL FOREST FIRE WARNING

Elevated heat, smoke or combustion gases have been detected by multiple forest monitoring stations in Forest Zone A.

Residents should remain alert, monitor official emergency information and prepare for further instructions.
```

#### Reason for stakeholder selection

Homeowners receive the earliest warning because they may need time to prepare. The fire service is not yet sent an emergency dispatch message because the available evidence has not reached the higher confirmation level.

---

### 12.3 Level 2 — Fire Emergency

#### Conditions

Level 2 is activated when either of the following rules is satisfied:

```text
Rule A:
At least 2 stations are HIGH_RISK
AND
at least 1 of those stations reports flame evidence
```

or:

```text
Rule B:
At least 3 stations are HIGH_RISK
```

#### Stakeholders alerted

- Local homeowners
- Fire service

#### Homeowner message

```text
FOREST FIRE EMERGENCY

A possible forest fire has been detected by multiple monitoring stations in Forest Zone A.

Residents should prepare for possible evacuation and follow instructions issued by emergency services.
```

#### Fire-service message

```text
FIRE SERVICE ALERT

Multiple forest monitoring stations have reported dangerous heat, smoke or combustion conditions in Forest Zone A.

Flame activity has been detected or three stations have independently confirmed high-risk conditions. Immediate investigation is required.
```

#### Fire-service alert data

The fire-service alert should also include:

- Zone name
- Current alert level
- Affected station IDs
- Number of high-risk stations
- Number of flame detections
- Highest ambient temperature
- Highest surface temperature
- Highest smoke value
- Highest carbon-monoxide value
- Time of decision

#### Reason for stakeholder selection

At this stage, there is enough independent evidence to justify emergency-service investigation. News organisations and social media are not alerted yet because public broadcasting should require stronger confirmation.

---

### 12.4 Level 3 — Confirmed Forest Fire

#### Conditions

All of the following must be true:

```text
At least 3 stations are CRITICAL
AND
at least 2 different stations report flameDetected == true
AND
all supporting readings are within the 30-second comparison window
```

#### Stakeholders alerted

- Local homeowners
- Fire service
- News organisations
- Social media services

#### Homeowner message

```text
EMERGENCY EVACUATION WARNING

A forest fire has been confirmed by multiple monitoring stations in Forest Zone A.

Follow official emergency instructions and prepare to evacuate immediately.
```

#### Fire-service message

```text
CRITICAL FOREST FIRE ALERT

A confirmed forest fire has been detected in Forest Zone A.

Three or more monitoring stations have reported critical conditions, with flame activity confirmed by multiple stations. Immediate emergency response is required.
```

#### News-organisation message

```text
CONFIRMED FOREST FIRE NOTIFICATION

The forest monitoring system has confirmed a fire in Forest Zone A using readings from multiple independent monitoring stations.

Emergency services have been notified. Public reporting should refer to updates issued through official emergency authorities.
```

#### Social-media message

```text
PUBLIC SAFETY ALERT: A forest fire has been confirmed in Forest Zone A. Avoid the affected area and follow instructions from emergency services.
```

#### Reason for stakeholder selection

News and social-media notifications are only produced after strong multi-station confirmation. This reduces the chance of spreading an incorrect public emergency message based on faulty or isolated sensor data.

## 13. Stakeholder Alert Matrix

| System level | Local homeowners | Fire service | News organisations | Social media |
|---|---|---|---|---|
| Level 0 — Normal | No | No | No | No |
| Level 1 — Local Warning | Yes | No | No | No |
| Level 2 — Fire Emergency | Yes | Yes | No | No |
| Level 3 — Confirmed Fire | Yes | Yes | Yes | Yes |
| All Clear | Yes, if previously alerted | Yes, if previously alerted | Yes only if Level 3 was reached | Yes only if Level 3 was reached |

## 14. Alert-State and Duplicate-Prevention Rules

Node-RED will store the current system alert level. Messages will only be sent when the alert state changes.

Examples:

```text
NORMAL -> LOCAL_WARNING
LOCAL_WARNING -> FIRE_EMERGENCY
FIRE_EMERGENCY -> CONFIRMED_FIRE
CONFIRMED_FIRE -> ALL_CLEAR
```

The same alert will not be republished every time a new telemetry message arrives while the system remains at the same level.

When the alert level increases, Node-RED will send the messages required by the new level. When the level decreases, the system will continue monitoring but will not immediately send an all-clear message until the all-clear conditions have been maintained for the required period.

## 15. All-Clear Conditions

An all-clear message will only be generated when all five stations remain below the following safe thresholds for at least **60 continuous seconds**:

```text
ambientTemperature < 40°C
surfaceTemperature < 55°C
smokeLevel < 30
carbonMonoxide < 25
flameDetected == false
```

### All-clear message

```text
ALL-CLEAR UPDATE

Sensor readings across Forest Zone A have remained within safe limits for 60 seconds. The immediate forest-fire alert has been cleared, and monitoring will continue.
```

The all-clear message will only be sent to stakeholder groups that received the preceding alert. For example, news organisations and social media will receive the all-clear message only when the system previously reached Level 3.

## 16. Node-RED Processing Design

The main Node-RED flow will contain the following logical stages:

```text
MQTT In
   |
JSON validation
   |
Store latest reading by station ID
   |
Remove stale station readings
   |
Classify each station
   |
Count HIGH_RISK, CRITICAL and flame-confirming stations
   |
Determine system alert level
   |
Compare new level with previous level
   |
Stakeholder message templates
   |
MQTT Out nodes and Debug nodes
```

Suggested Node-RED nodes include:

- One `mqtt in` node using `forest_fire/stations/+/telemetry`
- A `json` node if the incoming payload is a JSON string
- A validation `function` node
- A state-storage and decision `function` node
- A `switch` node for alert-level routing
- Separate message-template or `change` nodes for each stakeholder
- Four MQTT output nodes for stakeholder alerts
- Debug nodes for evidence and testing

## 17. Simulation Behaviour

The Node.js sensor simulator will support controlled scenarios so that each alert level can be demonstrated reliably.

### Normal scenario

All five stations publish values below warning thresholds.

### Isolated anomaly scenario

Only one sensor or one station publishes dangerous values. No external alert should be generated.

### Local-warning scenario

Two stations publish high heat and smoke values without strong flame confirmation. Only homeowners should be alerted.

### Fire-emergency scenario

Two high-risk stations are detected and at least one detects flame, or three stations become high risk. Homeowners and the fire service should be alerted.

### Confirmed-fire scenario

At least three stations become critical and at least two detect flames. All stakeholder groups should be alerted.

### Recovery scenario

All stations return to safe values for 60 seconds. The system should publish an all-clear message.

## 18. Example Alert Payload

Node-RED can publish structured JSON alerts such as:

```json
{
  "alertLevel": 2,
  "status": "FIRE_EMERGENCY",
  "zone": "forest_zone_a",
  "message": "Multiple monitoring stations have detected possible forest fire conditions.",
  "affectedStations": ["station_1", "station_2"],
  "highRiskStationCount": 2,
  "criticalStationCount": 1,
  "flameStationCount": 1,
  "maximumAmbientTemperature": 58,
  "maximumSurfaceTemperature": 84,
  "maximumSmokeLevel": 83,
  "maximumCarbonMonoxide": 76,
  "timestamp": "2026-07-23T10:05:00.000Z"
}
```

## 19. Design Decisions and Justification

The design uses five sensor types because forest-fire detection should not depend on a single environmental measurement. Temperature sensors detect heat, smoke and carbon-monoxide sensors detect combustion products, and the flame sensor provides direct evidence of active fire.

The system also requires agreement between multiple stations. A faulty sensor, a hot object near one station or temporary smoke from a non-fire source should not automatically trigger emergency messages. Requiring multiple evidence groups at station level and multiple stations at system level provides two layers of false-alarm protection.

Stakeholders receive different alerts according to their responsibilities. Homeowners receive early preparation warnings, the fire service receives operational details once emergency investigation is justified, and news and social-media alerts are reserved for confirmed fire conditions.

## 20. Final Decision Summary

```text
One abnormal sensor:
No alert.

One high-risk station:
No external alert.

Two high-risk stations:
Level 1 homeowner warning.

Two high-risk stations plus flame evidence, or three high-risk stations:
Level 2 homeowner and fire-service emergency alerts.

Three critical stations plus flame evidence from at least two stations:
Level 3 alerts to homeowners, fire service, news organisations and social media.

All five stations safe for 60 seconds:
All-clear message to previously alerted stakeholders.
```
