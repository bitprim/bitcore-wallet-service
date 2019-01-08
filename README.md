
# keoken-wallet-service

[![NPM Package](https://img.shields.io/npm/v/keoken-wallet-service.svg?style=flat-square)](https://www.npmjs.org/package/keoken-wallet-service)
[![Build Status](https://img.shields.io/travis/bitprim/keoken-wallet-service.svg?branch=master&style=flat-square)](https://travis-ci.org/bitprim/keoken-wallet-service)
<!-- TODO: Configure Coveralls for our repo -->
<!-- [![Coverage Status](https://coveralls.io/repos/bitpay/bitcore-wallet-service/badge.svg?branch=master)](https://coveralls.io/r/bitprim/keoken-wallet-service?branch=master) -->

A Multisig HD Keoken Wallet Service.

# Description

Keoken Wallet Service facilitates multisig HD wallets creation and operation through a (hopefully) simple and intuitive REST API.

KWS can usually be installed within minutes and accommodates all the needed infrastructure for peers in a multisig wallet to communicate and operate – with minimum server trust.
  
See [keoken-wallet-client](https://github.com/bitprim/keoken-wallet-client) for the *official* client library that communicates with KWS and validates its responses.

KWS is been used in production enviroments for [Keoken Wallet](https://keoken.io).

# Getting Started
```
 git clone https://github.com/bitprim/keoken-wallet-service.git
 cd keoken-wallet-service
 npm install
 npm start
```

This will launch the KWS service (with default settings) at `http://localhost:3232/bws/api`.

KWS needs mongoDB. You can configure the connection at `config.js`

KWS supports SSL and Clustering. For a detailed guide on installing KWS with extra features see [Installing KWS](https://github.com/bitprim/keoken-wallet-service/blob/master/installation.md). 

KWS uses by default a Request Rate Limitation for its CreateWallet endpoint. If you need to modify it, check defaults.js' `Defaults.RateLimit`

# Using KWS with PM2

KWS can be used with PM2 with the provided `app.js` script: 
 
```
  pm2 start app.js --name "keoken-wallet-service"
```

# Security Considerations
 * Private keys are never sent to KWS. Copayers store them locally.
 * Extended public keys are stored on KWS. This allows KWS to easily check wallet balance, send offline notifications to copayers, etc.
 * During wallet creation, the initial copayer creates a wallet secret that contains a private key. All copayers need to prove they have the secret by signing their information with this private key when joining the wallet. The secret should be shared using secured channels.
 * A copayer could join the wallet more than once, and there is no mechanism to prevent this.
 * All KWS responses are verified:
  * Addresses and change addresses are derived independently and locally by the copayers from their local data.
  * TX Proposals templates are signed by copayers and verified by others, so KWS cannot create or tamper with them.

# Using SSL

  You can add your certificates at config.js using:

``` json
   https: true,
   privateKeyFile: 'private.pem',
   certificateFile: 'cert.pem',
  ////// The following is only for certs which are not
  ////// trusted by nodejs 'https' by default
  ////// CAs like Verisign do not require this
  // CAinter1: '', // ex. 'COMODORSADomainValidationSecureServerCA.crt'
  // CAinter2: '', // ex. 'COMODORSAAddTrustCA.crt'
  // CAroot: '', // ex. 'AddTrustExternalCARoot.crt'
```

@dabura667 made a report about how to use letsencrypt with BWS, which applies to KWS: https://github.com/bitpay/bitcore-wallet-service/issues/423
  

# REST API

Note: all currency amounts are in units of satoshis (1/100,000,000 of a bitcoin).

## Authentication

  In order to access a wallet, clients are required to send the headers:
```
  x-identity
  x-signature
```
Identity is the Peer-ID, this will identify the peer and its wallet. Signature is the current request signature, using `requestSigningKey`, the `m/1/1` derivative of the Extended Private Key.

See [Keoken Wallet Client](https://github.com/bitprim/keoken-wallet-client/blob/master/lib/api.js#L73) for implementation details.


## GET Endpoints
`/v1/wallets/`: Get wallet information

Returns:
 * Wallet object. (see [fields on the source code](https://github.com/bitprim/keoken-wallet-service/blob/master/lib/model/wallet.js)).

`/v1/txhistory/`: Get Wallet's transaction history
 
Optional Arguments:
 * skip: Records to skip from the result (defaults to 0)
 * limit: Total number of records to return (return all available records if not specified).
 
Returns:
 * History of incoming and outgoing transactions of the wallet. The list is paginated using the `skip` & `limit` params. Each item has the following fields:
 * action ('sent', 'received', 'moved')
 * amount
 * fees
 * time
 * addressTo
 * confirmations
 * proposalId
 * creatorName
 * message
 * actions array ['createdOn', 'type', 'copayerId', 'copayerName', 'comment']
  
 
`/v1/txproposals/`:  Get Wallet's pending transaction proposals and their status
Returns:
 * List of pending TX Proposals. (see [fields on the source code](https://github.com/bitprim/keoken-wallet-service/blob/master/lib/model/txproposal.js))

`/v1/addresses/`: Get Wallet's main addresses (does not include change addresses)

Returns:
 * List of Addresses object: (https://github.com/bitprim/keoken-wallet-service/blob/master/lib/model/address.js)).  This call is mainly provided so the client can check these addresses for incoming transactions (using a service like [Insight](https://insight.is)

`/v1/balance/`:  Get Wallet's balance

Returns:
 * totalAmount: Wallet's total balance
 * lockedAmount: Current balance of outstanding transaction proposals, that cannot be used on new transactions.
 * availableAmount: Funds available for new proposals.
 * totalConfirmedAmount: Same as totalAmount for confirmed UTXOs only.
 * lockedConfirmedAmount: Same as lockedAmount for confirmed UTXOs only.
 * availableConfirmedAmount: Same as availableAmount for confirmed UTXOs only.
 * byAddress array ['address', 'path', 'amount']: A list of addresses holding funds.
 * totalKbToSendMax: An estimation of the number of KiB required to include all available UTXOs in a tx (including unconfirmed).

`/v1/txnotes/:txid`:  Get user notes associated to the specified transaction.
Returns:
 * The note associated to the `txid` as a string.

`/v1/fiatrates/:code`:  Get the fiat rate for the specified ISO 4217 code.
Optional Arguments:
 * provider: An identifier representing the source of the rates.
 * ts: The timestamp for the fiat rate (defaults to now).

Returns:
 * The fiat exchange rate.
 
## POST Endpoints
`/v1/wallets/`: Create a new Wallet

 Required Arguments:
 * name: Name of the wallet 
 * m: Number of required peers to sign transactions 
 * n: Number of total peers on the wallet
 * pubKey: Wallet Creation Public key to check joining copayer's signatures (the private key is unknown by BWS and must be communicated
  by the creator peer to other peers).

Returns: 
 * walletId: Id of the new created wallet


`/v1/wallets/:id/copayers/`: Join a Wallet during its creation

Required Arguments:
 * walletId: Id of the wallet to join
 * name: Copayer Name
 * xPubKey - Extended Public Key for this copayer.
 * requestPubKey - Public Key used to check requests from this copayer.
 * copayerSignature - Signature used by other copayers to verify that the copayer joining knows the wallet secret.

Returns:
 * copayerId: Assigned ID of the copayer (to be used on x-identity header)
 * wallet: Object with wallet's information

`/v1/txproposals/`: Add a new transaction proposal

Required Arguments:
 * toAddress: RCPT Bitcoin address.
 * amount: amount (in satoshis) of the mount proposed to be transfered
 * proposalsSignature: Signature of the proposal by the creator peer, using proposalSigningKey.
 * (opt) message: Encrypted private message to peers.
 * (opt) payProUrl: Paypro URL for peers to verify TX
 * (opt) feePerKb: Use an alternative fee per KB for this TX.
 * (opt) excludeUnconfirmedUtxos: Do not use UTXOs of unconfirmed transactions as inputs for this TX.

Returns:
 * TX Proposal object. (see [fields on the source code](https://github.com/bitprim/keoken-wallet-service/blob/master/lib/model/txproposal.js)). `.id` is probably needed in this case.


`/v3/addresses/`: Request a new main address from wallet . (creates an address on normal conditions)

Returns:
 * Address object: (https://github.com/bitprim/keoken-wallet-service/blob/master/lib/model/address.js)). Note that `path` is returned so that the client can derive the address independently and check server's response.

`/v1/txproposals/:id/signatures/`: Sign a transaction proposal

Required Arguments:
 * signatures:  All Transaction's input signatures, in order of appearance.
  
Returns:
 * TX Proposal object. (see [fields on the source code](https://github.com/bitprim/keoken-wallet-service/blob/master/lib/model/txproposal.js)). `.status` is probably needed in this case.
  
`/v1/txproposals/:id/broadcast/`: Broadcast a transaction proposal
 
Returns:
 * TX Proposal object. (see [fields on the source code](https://github.com/bitprim/keoken-wallet-service/blob/master/lib/model/txproposal.js)). `.status` is probably needed in this case.
  
`/v1/txproposals/:id/rejections`: Reject a transaction proposal
 
Returns:
 * TX Proposal object. (see [fields on the source code](https://github.com/bitprim/keoken-wallet-service/blob/master/lib/model/txproposal.js)). `.status` is probably needed in this case.

`/v1/addresses/scan`: Start an address scan process looking for activity.

 Optional Arguments:
 * includeCopayerBranches: Scan all copayer branches following BIP45 recommendation (defaults to false). 

`/v1/txconfirmations/`: Subscribe to receive push notifications when the specified transaction gets confirmed.
Required Arguments:
 * txid:  The transaction to subscribe to.

## PUT Endpoints
`/v1/txnotes/:txid/`: Modify a note for a tx.


## DELETE Endpoints
`/v1/txproposals/:id/`: Deletes a transaction proposal. Only the creator can delete a TX Proposal, and only if it has no other signatures or rejections

 Returns:
 * TX Proposal object. (see [fields on the source code](https://github.com/bitprim/keoken-wallet-service/blob/master/lib/model/txproposal.js)). `.id` is probably needed in this case.

`/v1/txconfirmations/:txid`: Unsubscribe from transaction `txid` and no longer listen to its confirmation.

   
# Push Notifications
  Recomended to complete config.js file:
  
  * [How to get your FCM API key](https://dev.tapjoy.com/faq/how-to-find-sender-id-and-api-key-for-gcm/)
  * [Apple's Notification guide to know how to get your certificates for APN](https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/Introduction.html)


## POST Endpoints
`/v1/pushnotifications/subscriptions/`: Adds subscriptions for push notifications service at database.


## DELETE Endpoints
`/v2/pushnotifications/subscriptions/`: Remove subscriptions for push notifications service from database.

 



