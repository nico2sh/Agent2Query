var assert = require('assert');
var https = require('node:https');

// Validation functions
function justLog(name, value, expected) {
  console.log('field name: `' + name + '` should validate with: `' + expected + '`, it is `' + value + '`');
}
function eq(name, value, expected) {
  assert.ok(value == expected, 'Wrong value for `' + name + '`, expected `' + expected + '`, got `' + value +'`');
}
function regex(name, value, expected) {
  const regex = new RegExp(expected);
  assert.ok(regex.test(value), 'No Regex match for `' + name + '`, regex: `' + expected + '`, got `' + value +'`');
}

// Define expected results using callback function
function callback(err, response, body) {
  assert.ok(response.statusCode == 200, 'Expected 200 OK response, got ' + response.statusCode);
  var results = body.data.actor.account.nrql.results;
  assert.ok(results.length > 0, 'Didn\'t get any results for query');
  
  for (let i = 0; i < results.length; i++) {
    // We validate each field
    var result = results[i];
    for(let j = 0; j < checks.length; j++) {
      let check = checks[j];
      let func = check['function'];
      let fieldName = check['field'];
      let value = check['value'];
      func(fieldName, result[fieldName], value);
    }
  }

  // Log JSON results from endpoint to Synthetics console
  console.log('Script execution completed');
}

// The main thing
function validate(account_id, api_key, query, checks) {
  const options = {
    // Define endpoint URI, https://api.eu.newrelic.com/graphql for EU accounts
    uri: 'https://staging-api.newrelic.com/graphql',
    headers: {
      'API-key': api_key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query getNrqlResults($accountId: Int!, $nrql: Nrql!) {
          actor {
            account(id: $accountId) {
              nrql(query: $nrql) {
                results
              }
            }
          }
        }
    ` ,
      variables: {
        accountId: Number(account_id),
        nrql: query,
      },
    }),
  };

  // Make POST request, passing in options and callback
  $https.post(options, callback);
}

module.exports = { validate, justLog, eq, regex };
