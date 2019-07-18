/* 
  API -> REVISED JSON -> SQL STORED PROCEDURE -> Stored in SQL TABLE
  AUTHOR: Ben Herriott 
  REVISED: 2019-07-18
  Only compatible with SQL SERVER 2016 and higher
  Takes in data from a Web API takes the data needed and either UPDATES/INSERTS the record on the SQL end into a table. 
  This script is used in a scheduled task to populate a MSSQL table so that data can be used elsewheres.
*/

const fetch  = require('node-fetch');
const sql    = require('mssql');
const config = require ('./config');
/* const place = require('named-placeholders')(); if you was parsing a string with variables i.e. ${blah} use
  the placeholders npm it prevents sql injection but the promises used prevent that */

(function() { // self invoking function
  let arr = [];
  const pool1 = new sql.ConnectionPool(config.db).connect();
  // collects all data for the future calendar respective of the subscriber
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
          let obj = {
            vessel: currEntry.vessel['name'],
            originalDate: new Date(currEntry.original_eta),
            eeseaETA: new Date(currEntry.eesea_eta),
            berth: null,
            vCode: null,
            etaType: currEntry.eesea_eta_type
          };
          arr.push(obj);
        }
      }
      //console.dir(arr);
      parseSQL(JSON.stringify(arr), pool1); // Stored procedure used which can handle complex JSON arrays
      console.log("DONE");
      //sql.close();
      setTimeout(() => {
        process.exit();
      }, 2000);
    })
    .catch(error => { console.error(error); }); // errors pertaining to the call to the API
})();

function parseSQL(stringArr, pool1) {
  return pool1.then((pool) => { // makes sure that the pool is fully initialized/connected
    pool.request()
    .input('json', sql.NVarChar(sql.MAX), stringArr)
    .execute(config.sp2, (err) => { // INSERT/UPDATE sp no need for a return only err checking
      if (err) {
        console.log(err);
      }
    })
  });
}
