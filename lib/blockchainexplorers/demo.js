var Keoken = require('./keoken');

var temp = new Keoken({
    coin: 'bch',
    network: 'livenet',
    url: "http://66.70.180.6:4444",
    apiPrefix: "api",
    userAgent: "Bochanode",
    addressFormat: "legacy",
  });


  temp.getAssets()