var _ = require('lodash');
var log = require('npmlog');

function ScriptParser() {
}

/**
 * @param {string} keokenScript - Keoken output script in hex string format.
 * For example, for a simple send: 6a0400004b50100000000100000001000000000000001c
 * |   keoken_opcode (14 bytes)   |   tx_type (8 bytes)   |   asset_id (8 bytes)   |   amount (16 bytes)   |
 * @returns {integer} Amount in token count, or null if invalid or inexistent.
 */
ScriptParser.parseAmount = function(keokenScript) {
    var TX_AMOUNT_POS = 30;
    var amount = parseInt(keokenScript.substring(TX_AMOUNT_POS), 16);
    return _.isInteger(amount)? amount : null;
}

/**
 * @param {string} keokenScript - Keoken output script in hex string format.
 * For example, for a simple send: 6a0400004b50100000000100000001000000000000001c
 * |   keoken_opcode (14 bytes)   |   tx_type (8 bytes)   |   asset_id (8 bytes)   |   amount (16 bytes)   |
 * @returns {integer} Asset id as an integer, or null if invalid or inexistent.
 */
ScriptParser.parseAssetId = function(keokenScript) {
    var ASSET_ID_START_POS = 22;
    var ASSET_ID_LEN = 8;
    var assetId = parseInt(keokenScript.substring(ASSET_ID_START_POS, ASSET_ID_START_POS + ASSET_ID_LEN), 16);
    return _.isInteger(assetId)? assetId : null;
}

module.exports = ScriptParser;