'use strict';

var _ = require('lodash');
var async = require('async');
var $ = require('preconditions').singleton();
var log = require('npmlog');
log.debug = log.verbose;
var io = require('socket.io-client');
var requestList = require('./request-list');
var Common = require('../common');
var BCHAddressTranslator = require('../bchaddresstranslator');
var Constants = Common.Constants,
  Defaults = Common.Defaults,
  Utils = Common.Utils;

function Keoken(opts) {
  $.checkArgument(opts);
  $.checkArgument(Utils.checkValueInCollection(opts.network, Constants.NETWORKS));
  $.checkArgument(Utils.checkValueInCollection(opts.coin, Constants.COINS));
  $.checkArgument(opts.url);

  this.apiPrefix = _.isUndefined(opts.apiPrefix)? '/api' : opts.apiPrefix;
  this.coin = opts.coin || Defaults.COIN;
  this.network = opts.network || 'livenet';
  this.hosts = opts.url;
//   this.hosts = "http://66.70.180.6:4444/"
  this.userAgent = opts.userAgent || 'bws';

  if (opts.addressFormat)  {
    $.checkArgument(Constants.ADDRESS_FORMATS.includes(opts.addressFormat), 'Unkown addr format:' + opts.addressFormat);
    this.addressFormat = opts.addressFormat != 'copay' ? opts.addressFormat : null;
  }

  this.requestQueue = async.queue(this._doRequest.bind(this), Defaults.Keoken_REQUEST_POOL_SIZE);

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
Keoken.prototype.translateQueryAddresses = function(addresses) {
  if (!this.addressFormat) return addresses;
  return BCHAddressTranslator.translate(addresses, this.addressFormat, 'copay');
};


// Translate Result Address
Keoken.prototype.translateResultAddresses = function(addresses) {
  if (!this.addressFormat) return addresses;

  return BCHAddressTranslator.translate(addresses, 'copay', this.addressFormat);
};


Keoken.prototype.translateTx = function(tx) {
  var self = this;
  if (!this.addressFormat) return tx;

  _.each(tx.vin, function(x){
    if (x.addr) {
      x.addr =  self.translateResultAddresses(x.addr);
    }
  });


  _.each(tx.vout, function(x){
    if (x.scriptPubKey && x.scriptPubKey.addresses) {
      x.scriptPubKey.addresses = self.translateResultAddresses(x.scriptPubKey.addresses);
    }
  });

};


Keoken.prototype._doRequest = function(args, cb) {
  var opts = {
    hosts: this.hosts,
    headers: {
      'User-Agent': this.userAgent,
    }
  };

  var s  = JSON.stringify(args);
//  if ( s.length > 100 )
//    s= s.substr(0,100) + '...';
//  log.debug('', 'Keoken Q: %s', s);

  requestList(_.defaults(args, opts), cb);
};

Keoken.prototype.getConnectionInfo = function() {
  return 'Keoken (' + this.coin + '/' + this.network + ') @ ' + this.hosts;
};

/**
 * Retrieve a list of unspent outputs associated with an address or set of addresses
 */
Keoken.prototype.getAssets = function(cb, walletId) {
  var self = this; 

//   var url = this.url + this.apiPrefix + '/get_assets';
  var args = {
    method: 'GET',
    path: '/api/get_assets',
    json: {
    },
    walletId: walletId, //only to report
  };

  this.requestQueue.push(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));

    console.log(body)

    // if (self.addressFormat) {

    //   _.each(unspent, function(x) {
    //     x.address = self.translateResultAddresses(x.address);
    //   });
    // }
    return cb(null, body);
  });
};

Keoken.prototype.getAssetsByAddress = function(addr, cb) {
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

    console.log(body)

    return cb(null, body);
  });
};


/**
 * Broadcast a transaction to the bitcoin network
 */
Keoken.prototype.broadcast = function(rawTx, cb) {
  var args = {
    method: 'POST',
    path: this.apiPrefix + '/tx/send',
    json: {
      rawtx: rawTx
    },
  };

  this.requestQueue.push(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));
    return cb(null, body ? body.txid : null);
  });
};

Keoken.prototype.getTransaction = function(txid, cb) {
  var self = this;
  var args = {
    method: 'GET',
    path: this.apiPrefix + '/tx/' + txid,
    json: true,
  };

  this.requestQueue.push(args, function(err, res, tx) {
    if (res && res.statusCode == 404) return cb();
    if (err || res.statusCode !== 200)
      return cb(_parseErr(err, res));

    self.translateTx(tx);

    return cb(null, tx);
  });
};

Keoken.prototype.getTransactions = function(addresses, from, to, cb, walletId) {
  var self = this;


  var qs = [];
  var total;
  if (_.isNumber(from)) qs.push('from=' + from);
  if (_.isNumber(to)) qs.push('to=' + to);

  // Trim output
  qs.push('noAsm=1');
  qs.push('noScriptSig=1');
  qs.push('noSpent=1');

  var args = {
    method: 'POST',
    path: this.apiPrefix + '/addrs/txs' + (qs.length > 0 ? '?' + qs.join('&') : ''),
    json: {
      addrs: this.translateQueryAddresses(_.uniq([].concat(addresses))).join(',')
    },
    timeout: Defaults.Keoken_TIMEOUT * 1.2 , // little extra time
    walletId: walletId, //only to report
  };


  this.requestQueue.push(args, function(err, res, txs) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));

    if (_.isObject(txs)) {
      if (txs.totalItems)
        total = txs.totalItems;

      if (txs.items)
        txs = txs.items;
    }

    // NOTE: Whenever Keoken breaks communication with bitcoind, it returns invalid data but no error code.
    if (!_.isArray(txs) || (txs.length != _.compact(txs).length)) return cb(new Error('Could not retrieve transactions from blockchain. Request was:' + JSON.stringify(args)));

    if (self.addressFormat) {

      _.each(txs, function(tx){
        self.translateTx(tx);
      });
    }

    return cb(null, txs, total);
  });
};

Keoken.prototype.getAddressActivity = function(address, cb) {
  var self = this;

  var args = {
    method: 'GET',
    path: self.apiPrefix + '/addr/' + this.translateQueryAddresses(address),
    json: true,
  };

  this.requestQueue.push(args, function(err, res, result) {
    if (res && res.statusCode == 404) return cb();
    if (err || res.statusCode !== 200)
      return cb(_parseErr(err, res));

    // note: result.addrStr is not translated, but not used.  

    var nbTxs = result.unconfirmedTxApperances + result.txApperances;
    return cb(null, nbTxs > 0);
  });
};

Keoken.prototype.estimateFee = function(nbBlocks, cb) {
  var path = this.apiPrefix + '/utils/estimatefee';
  if (nbBlocks) {
    path += '?nbBlocks=' + [].concat(nbBlocks).join(',');
  }

  var args = {
    method: 'GET',
    path: path,
    json: true,
  };
  this.requestQueue.push(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));
    return cb(null, body);
  });
};

Keoken.prototype.getBlockchainHeight = function(cb) {
  var path = this.apiPrefix + '/sync';

  var args = {
    method: 'GET',
    path: path,
    json: true,
  };
  this.requestQueue.push(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));
    return cb(null, body.blockChainHeight);
  });
};

Keoken.prototype.getTxidsInBlock = function(blockHash, cb) {
  var self = this;

  var args = {
    method: 'GET',
    path: this.apiPrefix + '/block/' + blockHash,
    json: true,
  };

  this.requestQueue.push(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));
    return cb(null, body.tx);
  });
};

Keoken.prototype.initSocket = function() {

  // sockets always use the first server on the pull
  var socket = io.connect(_.first([].concat(this.hosts)), {
    'reconnection': true,
  });
  return socket;
};

module.exports = Keoken;



