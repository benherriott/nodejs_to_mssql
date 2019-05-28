const fetch  = require('node-fetch');
const sql    = require('mssql');
const config = require ('./config');
/* const place = require('named-placeholders')(); if you was parsing a string with variables i.e. ${blah} use
  the placeholders npm it prevents sql injection but the promises used prevent that */

(function() { // self invoking function
  const pool1 = new sql.ConnectionPool(config.db).connect();
  // collects all data from eVs forecasts respective of the subscriber
  const url = new URL(config.api.url);
  let params = {
    "apikey": config.api.key,
  }
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  let headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
  }
  // API get request
  fetch(url, {
    method: "GET",
    headers: headers
  }) // response data from the API
    .then(response => response.json())
    .then(json => {
      for (let i = 0; i < json.data.length; i++) {
        let currEntry = json.data[i]; // not all the data from the api is needed
        if (currEntry.vessel != null && currEntry.terminal != null && currEntry.terminal['code'] === "CAHALHT") {
          console.log(`${currEntry.vessel['name']},  ORIGINAL: ${currEntry.original_eta} ETA: ${currEntry.eesea_eta}`);
          parseSQL(currEntry.vessel['name'], new Date(currEntry.original_eta), new Date(currEntry.eesea_eta), null, null, pool1);
        }
      }
      console.log("DONE");
      process.exit();
    })
    .catch(error => { console.error(error); }); // errors pertaining to the call to the API
})();

function parseSQL(v, orig, eta, b, vc, pool1) {
  return pool1.then((pool) => { // makes sure that the pool is fully initialized/connected
    pool.request()
    .input('Vessel', sql.NVarChar(100), v)
    .input('Original', sql.DateTime, orig)
    .input('Eta', sql.DateTime, eta)
    .input('Berth', sql.NVARCHAR(100), b)
    .input('Voyage_Codes', sql.NVARCHAR(50), vc)
    .execute(config.sp, (err) => { // INSERT/UPDATE sp no need for a return only err checking
      if (err) {
        console.log(err);
      }
    })
  });
}
