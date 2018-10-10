'use strict';

var _ = require('lodash');
var async = require('async');
var $ = require('preconditions').singleton();
var log = require('npmlog');
log.debug = log.verbose;
var requestList = require('./request-list');
var Common = require('../common');
var BCHAddressTranslator = require('../bchaddresstranslator');
var Constants = Common.Constants,
  Defaults = Common.Defaults,
  Utils = Common.Utils;

function Insight(opts) {
  $.checkArgument(opts);
  $.checkArgument(Utils.checkValueInCollection(opts.network, Constants.NETWORKS));
  $.checkArgument(Utils.checkValueInCollection(opts.coin, Constants.COINS));
  $.checkArgument(opts.url);

  this.apiPrefix = _.isUndefined(opts.apiPrefix)? '/api' : opts.apiPrefix;
  this.coin = opts.coin || Defaults.COIN;
  this.network = opts.network || 'livenet';
  this.hosts = opts.url;
  this.userAgent = opts.userAgent || 'bws';

  if (opts.addressFormat)  {
    $.checkArgument(Constants.ADDRESS_FORMATS.includes(opts.addressFormat), 'Unkown addr format:' + opts.addressFormat);
    this.addressFormat = opts.addressFormat != 'copay' ? opts.addressFormat : null;
  }

  this.requestQueue = async.queue(this._doRequest.bind(this), Defaults.INSIGHT_REQUEST_POOL_SIZE);

}

var _parseErr = function(err, res) {
  if (err) {
    log.warn('Keoken error: ', err);
    return "Keoken Error";
  }
  log.warn("Keoken " + res.request.href + " Returned Status: " + res.statusCode);
  return "Error querying the Keoken API";
};


// Translate Request Address query
Insight.prototype.translateQueryAddresses = function(addresses) {
  if (!this.addressFormat) return addresses;
  return BCHAddressTranslator.translate(addresses, this.addressFormat, 'copay');
};


// Translate Result Address
Insight.prototype.translateResultAddresses = function(addresses) {
  if (!this.addressFormat) return addresses;

  return BCHAddressTranslator.translate(addresses, 'copay', this.addressFormat);
};


Insight.prototype._doRequest = function(args, cb) {
  var opts = {
    hosts: this.hosts,
    headers: {
      'User-Agent': this.userAgent,
      'responseType' : 'text',
    }
  };

  var s  = JSON.stringify(args);

  requestList(_.defaults(args, opts), cb);
};

Insight.prototype.getConnectionInfo = function() {
  return 'Insight (' + this.coin + '/' + this.network + ') @ ' + this.hosts;
};

/**
 * Retrieve a list of unspent outputs associated with an address or set of addresses
 */
Insight.prototype.getAssets = function(cb) {
  var self = this; 

  var args = {
    method: 'GET',
    path: '/api/get_assets',
    json: true,
  };

  this.requestQueue.push(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));

    // TODO (guille): Make the json message in Python use single quotes
    if (typeof body.replace == 'undefined'){
      return cb (null, []);
    }

    var body2 = body.replace(new RegExp('\'', 'g'), '"');
    
    try {
      var result = JSON.parse(body2);
      // console.log(result)
      return cb (null, result);
    } catch (e) {
      return cb (null, []);
    }

  });
};


Insight.prototype.getAssetsByAddress = function(addr, cb) {
  var self = this;
  var args = {
    method: 'GET',
    path: '/api/get_assets_by_address?address=' + this.translateQueryAddresses(addr),
    json: true,
  };

  this.requestQueue.push(args, function(err, res, body) {
    if (res && res.statusCode == 404) return cb();
    if (err || res.statusCode !== 200)
      return cb(_parseErr(err, res));

    // TODO (guille): Make the json message in Python use single quotes
    if (typeof body.replace == 'undefined'){
      return cb (null, []);
    }

    var body2 = body.replace(new RegExp('\'', 'g'), '"');
    try {
      var result = JSON.parse(body2);
      return cb (null, result);
    } catch (e) {
      return cb (null, []);
    }
  });
};


module.exports = Insight;