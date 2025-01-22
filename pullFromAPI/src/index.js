const axios = require("axios");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// init the dotenv config to use environment variables
dotenv.config();

// The token for the coinmarketcap API is saved in the .env file (you can request that from me)
const API_TOKEN = process.env.API_TOKEN;
// Interval of 1 minute
const FETCH_INTERVAL = 60000;
const filePath = path.join(__dirname, "../../data/rawData.json");
let counter = 1;

async function fetchData() {
  console.log(`Fetch Data method is called for the ${counter} time`);
  counter++;
  try {
    // API endpoint
    const url =
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";

    // Parameters for the API request
    const parameters = {
      symbol: "BTC,ETH,XRP", // Bitcoin symbol
      // convert: "USD", // Currency to convert price into
    };

    // Headers
    const headers = {
      Accepts: "application/json",
      "X-CMC_PRO_API_KEY": API_TOKEN,
    };

    let response = await axios.get(url, {
      params: parameters,
      headers: headers,
    });

    if (response) {
      console.log("Data fetched.");
      const json = response.data;
      console.log(json);
      let arrayToSave = [];

      // Transform the data to our data model
      Object.keys(response.data.data).forEach((key) => {
        const currencyData = response.data.data[key];
        arrayToSave.push({
          name: currencyData.name,
          priceInUSD: currencyData.quote.USD.price,
          time: currencyData.quote.USD.last_updated,
        });
      });

      console.log("Data tranformed.");

      // Read existing raw data from the file
      let existingData = [];
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf8");
        if (fileData) {
          existingData = JSON.parse(fileData);
        }
      }

      // Append new data to the existing raw data
      existingData.push(...arrayToSave);

      // writing the data to a persistent storage (currently json file, later db)
      // Currently synchronously, later async...
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

      console.log("Data saved successfully.");
    }
  } catch (ex) {
    // error
    console.log(`An Error occured: ${ex}`);
  }
}

// trgerring the function for the first time
fetchData();

// Running the function each x(1 minute) period of time, according to configuration
setInterval(fetchData, FETCH_INTERVAL);
