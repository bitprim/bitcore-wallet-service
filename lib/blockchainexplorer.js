'use strict';

var _ = require('lodash');
var $ = require('preconditions').singleton();
var log = require('npmlog');
var baseConfig = require('../config');
log.debug = log.verbose;

var Insight = require('./blockchainexplorers/insight');
var Common = require('./common');
var Constants = Common.Constants,
  Defaults = Common.Defaults,
  Utils = Common.Utils;

var PROVIDERS = {
  'insight': {
    'btc': {
      'livenet': baseConfig.blockchainExplorerOpts.btc.livenet.url,
      'testnet': baseConfig.blockchainExplorerOpts.btc.testnet.url
    },
    'bch': {
      'livenet': baseConfig.blockchainExplorerOpts.bch.livenet.url,
      'testnet': baseConfig.blockchainExplorerOpts.bch.testnet.url
    },
  },
};

function BlockChainExplorer(opts) {
  $.checkArgument(opts);

  var provider = opts.provider || 'insight';
  var coin = opts.coin || Defaults.COIN;
  var network = opts.network || 'livenet';

  $.checkState(PROVIDERS[provider], 'Provider ' + provider + ' not supported');
  $.checkState(_.contains(_.keys(PROVIDERS[provider]), coin), 'Coin ' + coin + ' not supported by this provider');
  $.checkState(_.contains(_.keys(PROVIDERS[provider][coin]), network), 'Network ' + network + ' not supported by this provider for coin ' + coin);

  var url = opts.url || PROVIDERS[provider][coin][network];
  var webSocketsUrl = baseConfig.blockchainExplorerOpts[coin][network].webSocketsUrl;

  if (coin != 'bch' && opts.addressFormat)
    throw new Error('addressFormat only supported for bch');

  if (coin == 'bch' && !opts.addressFormat)
    opts.addressFormat = 'cashaddr';

  switch (provider) {
    case 'insight':
      return new Insight({
        coin: coin,
        network: network,
        url: url,
        apiPrefix: opts.apiPrefix,
        userAgent: opts.userAgent,
        addressFormat: opts.addressFormat,
        webSocketsUrl: webSocketsUrl,
        useSocketIo: baseConfig.blockchainExplorerOpts.useSocketIo
      });
    default:
      throw new Error('Provider ' + provider + ' not supported.');
  };
};

module.exports = BlockChainExplorer;
