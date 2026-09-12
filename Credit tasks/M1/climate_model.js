// A small shared model used by the sensor nodes to generate more realistic
// readings than pure random numbers, based on area, season, and time of day.

// Rough seasonal baseline temperatures (°C) and typical rain/wind levels per CFA area.
const areaProfiles = {
    "Mallee":                    { summerTemp: 32, winterTemp: 14, baseRain: 20, baseWind: 25 },
    "Wimmera":                   { summerTemp: 30, winterTemp: 13, baseRain: 25, baseWind: 28 },
    "Northern Country":          { summerTemp: 31, winterTemp: 12, baseRain: 25, baseWind: 22 },
    "North Central":             { summerTemp: 29, winterTemp: 12, baseRain: 30, baseWind: 20 },
    "North East":                { summerTemp: 28, winterTemp: 10, baseRain: 40, baseWind: 18 },
    "Central":                   { summerTemp: 26, winterTemp: 11, baseRain: 35, baseWind: 22 },
    "East Gippsland":            { summerTemp: 24, winterTemp: 12, baseRain: 45, baseWind: 20 },
    "South West":                { summerTemp: 22, winterTemp: 12, baseRain: 50, baseWind: 30 },
    "West and South Gippsland":  { summerTemp: 23, winterTemp: 11, baseRain: 55, baseWind: 26 },
};

function getProfile(area) {
    return areaProfiles[area] || areaProfiles["Central"];
}

function getSeason(month) {
    // month: 1-12 (Southern Hemisphere seasons)
    if ([12, 1, 2].includes(month)) return "Summer";
    if ([3, 4, 5].includes(month)) return "Autumn";
    if ([6, 7, 8].includes(month)) return "Winter";
    return "Spring";
}

function seasonalBaseTemp(profile, season) {
    if (season === "Summer") return profile.summerTemp;
    if (season === "Winter") return profile.winterTemp;
    return (profile.summerTemp + profile.winterTemp) / 2;
}

// Generates a temperature reading for an area at a given Date, factoring in
// season and time of day (warmest mid-afternoon, coolest before dawn).
function generateTemp(area, date) {
    const profile = getProfile(area);
    const season = getSeason(date.getMonth() + 1);
    const base = seasonalBaseTemp(profile, season);

    const hour = date.getHours() + date.getMinutes() / 60;
    const hourOffset = 6 * Math.cos(((hour - 15) / 24) * 2 * Math.PI); // +/-6 degree daily swing, peak ~3pm

    const noise = (Math.random() - 0.5) * 4; // +/- 2 degrees of natural variation
    return Math.round((base + hourOffset + noise) * 10) / 10;
}

// Generates a rainfall reading (mm), more likely and heavier in winter.
function generateRain(area, date) {
    const profile = getProfile(area);
    const season = getSeason(date.getMonth() + 1);
    const seasonalFactor = season === "Winter" ? 1.4 : season === "Summer" ? 0.5 : 1.0;

    const rainEventChance = Math.random();
    if (rainEventChance > 0.7) {
        return Math.round(profile.baseRain * seasonalFactor * Math.random());
    }
    return 0;
}

// Generates a wind speed reading (km/h) around the area's typical baseline.
function generateWind(area, date) {
    const profile = getProfile(area);
    const noise = (Math.random() - 0.5) * 15;
    return Math.max(0, Math.round(profile.baseWind + noise));
}

// A simplified fire danger index derived from actual temperature, wind, and
// rain values, loosely modelled on the real-world principle that fire danger
// rises with heat and wind and falls with recent rainfall.
function fireRatingFromConditions(temp, wind, rain) {
    const score = temp * 1.5 + wind * 1.2 - rain * 2;
    if (score < 20) return "NO RATING";
    if (score < 40) return "MODERATE";
    if (score < 60) return "HIGH";
    if (score < 80) return "EXTREME";
    return "CATASTROPHIC";
}

module.exports = {
    getProfile,
    getSeason,
    generateTemp,
    generateRain,
    generateWind,
    fireRatingFromConditions,
};