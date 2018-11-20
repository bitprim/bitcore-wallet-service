var fileConfig = require('config');

var config = {
  basePath: '/bws/api',
  disableLogs: false,
  port: 3232,

  // Uncomment to make BWS a forking server
  // cluster: true,

  // Uncomment to set the number or process (will use the nr of availalbe CPUs by default)
  // clusterInstances: 4,

  // https: true,
  // privateKeyFile: 'private.pem',
  // certificateFile: 'cert.pem',
  ////// The following is only for certs which are not
  ////// trusted by nodejs 'https' by default
  ////// CAs like Verisign do not require this
  // CAinter1: '', // ex. 'COMODORSADomainValidationSecureServerCA.crt'
  // CAinter2: '', // ex. 'COMODORSAAddTrustCA.crt'
  // CAroot: '', // ex. 'AddTrustExternalCARoot.crt'

  storageOpts: {
      mongoDb: {
          uri: fileConfig.get('mongodbUrl'),
      },
  },
  lockOpts: {
      //  To use locker-server, uncomment this:
      lockerServer: {
          host: 'localhost',
          port: 3231,
      },
  },
  messageBrokerOpts: {
      //  To use message broker server, uncomment this:
      messageBrokerServer: {
          url: 'http://localhost:3380',
      },
  },
  blockchainExplorerOpts: {
      btc: {
          livenet: {
              provider: fileConfig.get('explorer.btc.livenet.provider'),
              url: fileConfig.get('explorer.btc.livenet.url'),
              webSocketsUrl: fileConfig.get('explorer.btc.livenet.webSocketsUrl')
          },
          testnet: {
              provider: fileConfig.get('explorer.btc.testnet.provider'),
              url: fileConfig.get('explorer.btc.testnet.url'),
              // Multiple servers (in priority order)
              // url: ['http://a.b.c', 'https://test-insight.bitpay.com:443'],
              webSocketsUrl: fileConfig.get('explorer.btc.testnet.webSocketsUrl')
          },
      },
      bch: {
          livenet: {
              provider: fileConfig.get('explorer.bch.livenet.provider'),
              url: fileConfig.get('explorer.bch.livenet.url'),
              addressFormat: fileConfig.get('explorer.bch.livenet.addressFormat'),  // copay, cashaddr, or legacy
              webSocketsUrl: fileConfig.get('explorer.bch.livenet.webSocketsUrl')
          },
          testnet: {
              provider: 'insight',
              url: 'https://tcust05.blockdozer.com:443',
              apiPrefix: '/insight-api',
              addressFormat: 'legacy', // copay, cashaddr, or legacy
          },

      },
  },
  keokenExplorerOpts: {
    coin: 'bch',
    network: 'livenet',
    url: "https://explorer.testnet.keoken.io",
    apiPrefix: "api",
    userAgent: "Bochanode",
    addressFormat: "legacy",
  },
  pushNotificationsOpts: {
    templatePath: './lib/templates',
    defaultLanguage: 'en',
    defaultUnit: 'bch',
    subjectPrefix: '',
    pushServerUrl: 'https://fcm.googleapis.com/fcm',
    authorizationKey: fileConfig.get('pushNotificationsServerKey'),
  },
  fiatRateServiceOpts: {
      defaultProvider: 'BitPay',
      fetchInterval: 60, // in minutes
  },
  emailOpts: {
   enableEmailNotifications: fileConfig.get('email.enableEmailNotifications'),
   host: fileConfig.get('email.mailerUrl'),
   port: fileConfig.get('email.mailerPort'),
   ignoreTLS: fileConfig.get('email.ignoreTLS'),
   subjectPrefix: '[Wallet Service]',
   from: 'info@bitprim.org',
   templatePath: './lib/templates',
   defaultLanguage: 'en',
   defaultUnit: 'bch',
   publicTxUrlTemplate: {
     btc: {
       livenet: 'https://btc.blockdozer.com/tx/{{txid}}',
       testnet: 'https://tbtc.blockdozer.com/tx/{{txid}}',
     },
     bch: {
       livenet: 'https://blockdozer.com/tx/{{txid}}',
       testnet: 'https://tbch.blockdozer.com/tx/{{txid}}',
     }
   },
  },
  // To use sendgrid:
  // var sgTransport = require('nodemail-sendgrid-transport');
  // mailer:sgTransport({
  //  api_user: xxx,
  //  api_key: xxx,
  // });
};
module.exports = config;
