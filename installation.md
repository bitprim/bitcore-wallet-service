The following document is a step-by-step guide to run KWS.

### Prerequisites
Ensure MongoDB (2.6+) is installed and running. This document assumes that mongod is running at the default port 27017.
See the configuration section to configure a different host/port.

### Install KWS from NPM
Use the following steps to Install KWS from the npmjs repository and run it with defaults.
```bash
npm install keoken-wallet-service
cd keoken-wallet-service
```
To change configuration before running, see the Configuration section.
```bash
npm start
```

### Install KWS from github source
Use the following steps to Install KWS from github source and run it with defaults.
```bash
git clone https://github.com/bitprim/keoken-wallet-service.git
cd keoken-wallet-service
npm install
```
To change configuration before running, see the Configuration section.
```bash
npm start
```
### Configuration
Configuration for all required modules can be specified in https://github.com/bitprim/keoken-wallet-service/blob/master/config.js

KWS is composed of 5 separate node services -
Locker - locker/locker.js
Message Broker - messagebroker/messagebroker.js
Blockchain Monitor - bcmonitor/bcmonitor.js (This service talks to the Blockchain Explorer service configured under blockchainExplorerOpts - see Configure blockchain service below.)
Email Service - emailservice/emailservice.js
Keoken Wallet Service - server.js

#### Configure MongoDB
Example configuration for connecting to the MongoDB instance:
```javascript
  storageOpts: {
    mongoDb: {
      uri: 'mongodb://localhost:27017/bws',
    },
  }
```
#### Configure Locker service
Example configuration for connecting to locker service:
```javascript
  lockOpts: {
    lockerServer: {
      host: 'localhost',
      port: 3231,
    },
  }
```

#### Configure Message Broker service
Example configuration for connecting to message broker service:
```javascript
  messageBrokerOpts: {
    messageBrokerServer: {
      url: 'http://localhost:3380',
    },
  }
```

#### Configure blockchain service
Note: this service will be used by blockchain monitor service as well as by KWS itself.
An example of this configuration is:
```javascript
  blockchainExplorerOpts: {
    livenet: {
      provider: 'insight',
      url: 'https://insight.bitpay.com:443',
    },
    testnet: {
      provider: 'insight',
      url: 'https://test-insight.bitpay.com:443',
    },
  }
```

#### Configure Email service
Example configuration for connecting to email service (using postfix):
```javascript
  emailOpts: {
    host: 'localhost',
    port: 25,
    ignoreTLS: true,
    subjectPrefix: '[Wallet Service]',
    from: 'wallet-service@keoken.io',
  }
```

#### Enable clustering
Change `config.js` file to enable and configure clustering:
```javascript
{
  cluster: true,
  clusterInstances: 4,
}
```

#### Configure Keoken Explorer
Change `config.js` file to configure Keoken Explorer (this is mandatory):
```javascript
keokenExplorerOpts: {
    coin: 'bch',
    network: 'livenet',
    url: "https://explorer.testnet.keoken.io",
    apiPrefix: "api",
    userAgent: "TestNode",
    addressFormat: "legacy",
}
```
