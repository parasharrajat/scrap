const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');

let $;

/**
 * returns a Promise which will give a output as 'output.json'
 *
 * @returns
 */
async function init() {
  const documentHtml = await getDocument('https://www.paiinternational.in/Stores');
  parseDocument(documentHtml);
  let stores = fetch();
  return Promise.all(stores.map(s => getGps(s.url))).then(res => {
    return stores.map((s, i) => ({ ...s, gps: res[i] }));
  });
}

/**
 * Download the Page as Text
 *
 * @param {*} url
 * @returns
 */
function getDocument(url) {
  return new Promise((reso, rej) => {
    https.get(url, {
      headers: {
        'Content-Type': 'text/plain'
      }
    }, (res) => {
      const { statusCode } = res;
      if (statusCode !== 200) {
        res.resume();
        return;
      }
      res.setEncoding('utf8');

      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          // console.log(rawData);
          reso(rawData);
        } catch (e) {
          console.error(e.message);
        }
      });
    }).on('error', (err) => rej(err));
  });

}
/**
 * parse the document download into Dom tree
 *
 * @param {*} docString
 */
function parseDocument(docString) {
  $ = cheerio.load(docString);
}
/**
 * Check that if the url can be used to get GPS
 *
 * @param {*} url
 * @returns
 */
function checkAgainstGoogleMap(url) {
  const Googreg = /^https?:\/\/(goo\.gl\/maps)/gi;
  const exec = Googreg.exec(url);
  if (exec) {
    return [url, !!exec[1].trim(0)];
  } else {
    throw new Error('Invalid Url');
  }
}
/**
 * Get the gps by fetching the data from the store address url after redirect url is fetched from
 * the server
 *
 * @param {*} url
 * @returns
 */
function getGps(url) {
  return new Promise((reso, rej) => {
    try {
      const [, isHttps] = checkAgainstGoogleMap(url);
    }
    catch (e) {
      reso('NOT_FOUND');
      return;
    }
    https.get(url, {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,hi;q=0.8",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        'Content-Type': 'text/plain'
      },

    }, (res) => {
      const { statusCode, headers } = res;
      const location = headers['location'];
      const gpsReg = /^.+google\.com\/maps\/place\/[^\/]+\/@([^\/]+)/gi;
      if (location) {
        const gpsFound = gpsReg.exec(location);
        // console.log(gpsFound, location);
        const [, gpsArray] = gpsFound;
        gpsArrayParts = gpsArray.split(',');
        const gps = {};
        gps.lat = gpsArrayParts[0].trim();
        gps.lng = gpsArrayParts[1].trim();
        reso(gps);
      }
      res.destroy();
    }).on('error', (e) => rej(e));
  });

}
/**
 * Parse the string
 *
 * @param {*} str
 * @returns
 */
function parseString(str) {
  return unescape(str.trim());
}
/**
 * Parse the pincode
 *
 * @param {*} str
 * @returns
 */
function parsePincode(str) {
  const pinReg = /(\d+)\s*.?\s*$/ig;
  const found = pinReg.exec(str.trim());
  return found ? found[1] : '';
}
/**
 * Fetch the store details from the dom tree
 *
 * @returns
 */
function fetch() {

  // function parsePhone(str) {
  //   const parts = str.split('Phone:');
  //   const phoneNumbers = parts[1].trim();
  //   const numbers = phoneNumbers.split('|').map(s => s.trim());
  //   return numbers;
  // }
  // function parseGps(str) {
  //   const parts = str.split('initialize(');
  //   const gpsValueIsHere = parts[1].trim();
  //   const partsAgain = gpsValueIsHere.split(',').map(s => s.trim());
  //   return { lat: partsAgain[0], lng: partsAgain[1] };
  // }
  const stores = [];
  const storesEls = $('.storeCont');

  storesEls.each((index, store) => {
    const zone = $(store).find('.locAdd > h3').first().text();
    const name = $(store).find('.locAdd > h4').first().text();
    const addressEl = $(store).find('.locAdd > p:last-child');

    let address = '';
    if (addressEl.contents().length) {
      const testNodeOnly = addressEl.contents().filter((_, n) => n.nodeType === 3);
      testNodeOnly.each((_, n) => address += $(n).text());
    }

    const gpsEl = $(store).find('.locAdd > p:last-child > a:last-child').first();
    const url = gpsEl.attr('href');
    // console.log(url);

    // const gps = parseGps(parseString(gpsStr));
    const storeData = {
      name: parseString(name),
      address: parseString(address),
      zone: parseString(zone),
      pincode: parsePincode(parseString(address)),
      url: url
    }
    stores.push(storeData);

  });
  return stores;
}


// run the code
init().then(res => {
  console.log(res);
  fs.writeFile("output.json", JSON.stringify(res), 'utf8', function (err) {
    if (err) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(err);
    }
    console.log("JSON file has been saved.");
  });
});
