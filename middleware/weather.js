const fs = require("fs");
const https = require("https");
const cityFinder = require("../controller/cityFinder");
const parseString = require("xml2js").parseString;
const weatherConditions = require("./conditions");

const unitConvert = (temperature) => {
  let temperatureF = temperature * 1.8 + 32;
  return temperatureF.toFixed(1);
};

const iconCondition = (currentConditions) => {
  if (weatherConditions["sunny"].includes(currentConditions[0])) {
    return "weather-icons/sunny-icon.png";
  } else if (weatherConditions["cloudy"].includes(currentConditions[0])) {
    return "weather-icons/cloudy-icon.png";
  } else if (weatherConditions["suncloud"].includes(currentConditions[0])) {
    return "weather-icons/partly-cloudy-icon.png";
  } else if (weatherConditions["rain"].includes(currentConditions[0])) {
    return "weather-icons/rain-icon.png";
  } else if (weatherConditions["snow"].includes(currentConditions[0])) {
    return "weather-icons/snow-icon.png";
  } else if (weatherConditions["clear"].includes(currentConditions[0])) {
    return "weather-icons/night-clear-icon.png";
  } else {
    return "weather-icons/question-mark-icon.npg";
  }
};

const temperatureExtract = (req, res) => {
  let cityToFind = req.query.city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(" ", "")
    .replace(".", "");
  const city = cityFinder(cityToFind);
  if (city) {
    const province = city.properties["Province Codes"];
    const cityName = city.properties["English Names"];
    const cityCode = city.properties.Codes;
    const unitType = req.query.unit;
    const url = `https://dd.weather.gc.ca/citypage_weather/xml/${province}/${cityCode}_e.xml`;
    https.get(url, (xml) => {
      let data = "";
      xml.on("data", (chunk) => {
        data += chunk;
      });

      xml.on("end", () => {
        parseString(data, (err, result) => {
          if (err) throw err;
          const temperature =
            result.siteData.currentConditions[0].temperature[0]["_"];
          const currentConditions =
            result.siteData.currentConditions[0].condition;
          if (unitType === "fahrenheit") {
            res.render("city", {
              city: cityName,
              province: province,
              temperature: `${unitConvert(temperature)} °F`,
              currentConditions: currentConditions,
              iconCondition: iconCondition(currentConditions),
            });
          } else {
            res.render("city", {
              city: cityName,
              province: province,
              temperature: `${temperature} °C`,
              currentConditions: currentConditions,
              iconCondition: iconCondition(currentConditions),
            
            });
          }
        });
      });
    });
    // console.log(result.siteData.currentConditions[0].temperature[0]["_"]);
  } else {
    res.render("404", {
      city: req.query.city,
    });
  }
};

module.exports = temperatureExtract;
