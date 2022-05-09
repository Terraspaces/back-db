var { connect, keyStores } = require("near-api-js");
var {
  formatNearAmount,
  parseNearAmount,
} = require("near-api-js/lib/utils/format");
var fetchUrl = require("fetch").fetchUrl;

const fs = require("fs");

var connectionString = process.env.NEAR_DB_CONNECTION;
//("postgres://public_readonly:nearprotocol@mainnet.db.explorer.indexer.near.dev/mainnet_explorer");

const homedir = require("os").homedir();
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = require("path").join(homedir, CREDENTIALS_DIR);
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

const config = {
  keyStore,
  networkId: process.env.NETWORK_ID, // "mainnet",
  nodeUrl: process.env.NODE_URL, //"https://rpc.mainnet.near.org",
  headers: {},
};

let collectionStats = new Map();

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

const CONTRACT_ACCOUNT_ID = process.env.CONTRACT_ACCOUNT_ID;

const FETCH_URL = process.env.FETCH_URL;

const getTrendingCollectionData = async () => {
  const collections = await getObserveCollections();
  const trending_data = {};
  for (let i = 0; i < collections.length; i++) {
    let data;
    if (!collectionStats.has(collections[i])) {
      data = {
        total_items: 0,
        total_listed: 0,
        total_owners: 0,
        floor_price: 0,
        floor_price_24: 0,
        floor_price_7: 0,
        total_volume: 0,
        instant_volume: 0,
        day_volume: 0,
      };
    } else {
      datas = collectionStats.get(collections[i]);
      data = datas[datas.length - 1];
    }
    trending_data[collections[i]] = data;
  }

  return trending_data;
};

const getTransactionsForCollection = async (account_id) => {
  if (collectionStats.has(account_id)) {
    let result = [];
    let data = collectionStats.get(account_id);
    let index = data.length - 144;
    if (index < 0) {
      for (let i = index; i <= 0; i++)
        result.push({
          total_items: 0,
          total_listed: 0,
          total_owners: 0,
          floor_price: 0,
          floor_price_24: 0,
          floor_price_7: 0,
          total_volume: 0,
          instant_volume: 0,
          day_volume: 0,
        });
      index = 0;
    }
    for (let i = index; i < data.length; i++) {
      result.push(data[i]);
    }

    return result;
  } else {
    return [];
  }
};

async function intervalFunc() {
  const collections = await getObserveCollections();
  for (let i = 0; i < collections.length; i++) {
    // source file is iso-8859-15 but it is converted to utf-8 automatically
    fetchUrl(FETCH_URL + collections[i], (error, meta, body) => {
      if (!collectionStats.has(collections[i]))
        collectionStats.set(collections[i], []);
      const current_data = collectionStats.get(collections[i]);
      if (error == undefined) {
        const stats = JSON.parse(body.toString());
        if (stats.data.results._id != undefined) {
          current_data.push({
            total_items: stats.data.results.total_cards,
            total_listed: stats.data.results.total_card_sale,
            total_owners: stats.data.results.total_owners,
            floor_price: Number.parseFloat(
              formatNearAmount(stats.data.results.floor_price).replace(",", "")
            ),
            floor_price_24:
              current_data.length > 143
                ? current_data[current_data.length - 144].floor_price
                : 0,
            floor_price_7:
              current_data.length > 1007
                ? current_data[current_data.length - 1008].floor_price
                : 0,
            total_volume: Number.parseFloat(
              formatNearAmount(stats.data.results.volume).replace(",", "")
            ),
            instant_volume:
              current_data.length > 0
                ? Number.parseFloat(
                    formatNearAmount(stats.data.results.volume).replace(",", "")
                  ) - current_data[current_data.length - 1].total_volume
                : 0,
            day_volume:
              current_data.length > 143
                ? Number.parseFloat(
                    formatNearAmount(stats.data.results.volume).replace(",", "")
                  ) - current_data[current_data.length - 143].total_volume
                : 0,
          });
        } else {
          if (current_data.length == 0) {
            current_data.push({
              total_items: 0,
              total_listed: 0,
              total_owners: 0,
              floor_price: 0,
              floor_price_24: 0,
              floor_price_7: 0,
              total_volume: 0,
              instant_volume: 0,
              day_volume: 0,
            });
          } else current_data.push(current_data[current_data.length - 1]);
        }
      } else {
        if (current_data.length == 0) {
          current_data.push({
            total_items: 0,
            total_listed: 0,
            total_owners: 0,
            floor_price: 0,
            floor_price_24: 0,
            floor_price_7: 0,
            total_volume: 0,
            instant_volume: 0,
            day_volume: 0,
          });
        } else current_data.push(current_data[current_data.length - 1]);
        console.log(error);
      }
      if (current_data.length > 1008) current_data.shift();
      collectionStats.set(collections[i], current_data);
    });
  }
  setTimeout(intervalFunc, 600000);
}

let near;
connect(config).then((result) => {
  near = result;
  intervalFunc();
});

module.exports = {
  getTrendingCollectionData: getTrendingCollectionData,
  getTransactionsForCollection: getTransactionsForCollection,
};
