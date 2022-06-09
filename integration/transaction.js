const { connect, keyStores } = require("near-api-js");

const homedir = require("os").homedir();
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = require("path").join(homedir, CREDENTIALS_DIR);
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

const CONTRACT_ACCOUNT_ID = process.env.CONTRACT_ACCOUNT_ID;

const config = {
  keyStore,
  networkId: process.env.NETWORK_ID,
  nodeUrl: process.env.NODE_URL,
  headers: {},
};

const getObserveCollections = async () => {
  try {
    // get collections from contract
    const rawResult = await near.connection.provider.query({
      request_type: "call_function",
      account_id: CONTRACT_ACCOUNT_ID,
      method_name: "get_observe_ids",
      args_base64: btoa(`{}`),
      finality: "optimistic",
    });
    const results = JSON.parse(Buffer.from(rawResult.result).toString());

    const rawResult1 = await near.connection.provider.query({
      request_type: "call_function",
      account_id: CONTRACT_ACCOUNT_ID,
      method_name: "get_nft_contract_ids",
      args_base64: btoa(`{}`),
      finality: "optimistic",
    });
    const results1 = JSON.parse(Buffer.from(rawResult1.result).toString());

    for (let i = 0; i < results1.length; i++) {
      if (!results.includes(results1[i])) {
        results.push(results1[i]);
      }
    }

    return results;
  } catch (error) {
    console.log(error);
    return [];
  }
};

let near;
connect(config).then((result) => {
  near = result;
});

module.exports = {
  getObserveCollections,
};
