const fs = require("fs");
const path = require("path");

const rawDataFilePath = path.join(__dirname, "../../data/rawData.json");
const opportunitiesFilePath = path.join(
  __dirname,
  "../../data/opportunities.json"
);
const TIME_INTERVAL = 1800000;
let counter = 1;

async function processData() {
  // const url =
  //   "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest";
  console.log(`ProcessData function called for the ${counter} time`);
  counter++;
  try {
    // Read existing data from the file
    let existingRawData = [];
    if (fs.existsSync(rawDataFilePath)) {
      const fileData = fs.readFileSync(rawDataFilePath, "utf8");
      if (fileData) {
        existingRawData = JSON.parse(fileData);
      }
    }

    // Filter only the data from the last interval of time
    const newDataSinceTheLastInterval = existingRawData.filter((item) => {
      let timeOfItemInTimeStamp = new Date(item.time).getTime();
      let currentTimeInTimeStamp = Date.now();
      let currentTimeMinusIntervalTimeStamp =
        currentTimeInTimeStamp - TIME_INTERVAL;
      let isNewerThanLastInterval =
        timeOfItemInTimeStamp > currentTimeMinusIntervalTimeStamp;
      return isNewerThanLastInterval;
    });

    // Grouping the filtered data by time point
    const groupedData = newDataSinceTheLastInterval.reduce((acc, item) => {
      const time = item.time;
      if (!acc[time]) {
        acc[time] = [];
      }
      acc[time].push(item);
      return acc;
    }, {});

    // Filter only the data that meets the conditions (can be changed of course)
    const opportunities = Object.values(groupedData).filter((group) => {
      const btc = group.find((item) => item.name === "Bitcoin");
      const eth = group.find((item) => item.name === "Ethereum");
      const xrp = group.find((item) => item.name === "XRP");

      // make sure that I have data on that time point on all the currencies
      // and then check some logic that I decided on
      return (
        btc &&
        eth &&
        xrp &&
        btc.priceInUSD > eth.priceInUSD * 3 &&
        eth.priceInUSD > xrp.priceInUSD
      );
    });

    // Reading the existing data from the opportunities data file
    let existingData = [];
    if (fs.existsSync(opportunitiesFilePath)) {
      const fileData = fs.readFileSync(opportunitiesFilePath, "utf8");
      if (fileData) {
        existingData = JSON.parse(fileData);
      }
    }

    // Append the new opportunities to the existing ones
    existingData.push(...opportunities);

    // writing the data to a persistent storage (currently json file, later db)
    // Currently synchronously, later async...
    fs.writeFileSync(
      opportunitiesFilePath,
      JSON.stringify(existingData, null, 2)
    );

    console.log("Data saved successfully.");
  } catch (ex) {
    // error
    console.log(`An Error occured: ${ex}`);
  }
}

// trigerring the function for the first time
processData();

// Running the function each x(10 minutes) period of time, according to configuration
setInterval(processData, TIME_INTERVAL);
