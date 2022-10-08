const collectionModel = require("./model/collection");
const tempStatisticsModel = require("./model/temp-statistics");
const mongoose = require("mongoose");

const feed_temp_statistics_for_collection = async (collection_name) => {
  console.time(feed_temp_statistics_for_collection_test.name);
  console.log("collection_name", collection_name);
  let statistics_result = [];

  const today = new Date();
  const last_week_date = new Date();
  last_week_date.setDate(today.getDate() - 8);

  const aggregation = [
    {
      $match: { name: collection_name },
    },
    {
      $project: {
        created_at: 0,
        updated_at: 0,
      },
    },
    {
      $unwind: "$statistics",
    },

    // TODO: Uncomment
    // {
    //   $match: {
    //     "statistics.created_at": {
    //       $gte: last_week_date,
    //     },
    //   },
    // },
    {
      $sort: { "statistics.created_at": -1 },
    },
  ];

  const temp_statistics = await collectionModel.aggregate(aggregation, {
    allowDiskUse: true,
  });

  for (let i = 0; i < temp_statistics.length; i++) {
    console.time(`${i}-${collection_name}-temp_statistics`);
    const current_statistic = temp_statistics[i];
    let previous_statistic =
      i < temp_statistics.length - 2
        ? temp_statistics[i + 1]
        : temp_statistics[i];

    if (!Object.keys(previous_statistic).includes("total_volume")) {
      previous_statistic = {
        total_volume: 0,
      };
    }

    const statistic = current_statistic.statistics;
    const created_at_date = statistic.created_at
      .toLocaleDateString()
      .replaceAll("/", "-");

    const created_at_date_7 = new Date(statistic.created_at);

    created_at_date_7.setDate(created_at_date_7.getDate() - 7);

    const created_at_date_7_string = created_at_date_7
      .toLocaleDateString()
      .replaceAll("/", "-");

    let first_of_the_day = await collectionModel.aggregate([
      {
        $match: { name: collection_name },
      },
      {
        $project: {
          created_at: 0,
          updated_at: 0,
        },
      },
      {
        $unwind: "$statistics",
      },
      {
        $match: {
          $and: [
            {
              "statistics.created_at": {
                $gte: new Date(`${created_at_date}T00:00:00.000Z`),
              },
            },
            {
              "statistics.created_at": {
                $lte: new Date(`${created_at_date}T23:59:59.000Z`),
              },
            },
          ],
        },
      },
      {
        $sort: { "statistics.created_at": 1 },
      },
      {
        $limit: 1,
      },
    ]);

    if (first_of_the_day.length > 0) {
      first_of_the_day = first_of_the_day[0];
    } else {
      first_of_the_day = { floor_price: 0, total_volume: 0 };
    }

    let first_of_last_7_days = await collectionModel.aggregate([
      {
        $match: { name: collection_name },
      },
      {
        $project: {
          created_at: 0,
          updated_at: 0,
        },
      },
      {
        $unwind: "$statistics",
      },
      {
        $match: {
          $and: [
            {
              "statistics.created_at": {
                $gte: new Date(`${created_at_date_7_string}T00:00:00.000Z`),
              },
            },
            {
              "statistics.created_at": {
                $lte: new Date(`${created_at_date_7_string}T23:59:59.000Z`),
              },
            },
          ],
        },
      },
      {
        $sort: { "statistics.created_at": 1 },
      },
      {
        $limit: 1,
      },
    ]);

    if (first_of_last_7_days.length > 0) {
      first_of_last_7_days = first_of_last_7_days[0];
    } else {
      first_of_last_7_days = { floor_price: 0, total_volume: 0 };
    }

    const stat = {
      total_items: statistic.total_items,
      total_listed: statistic.total_listed,
      total_owners: statistic.total_owners,
      floor_price: statistic.floor_price,
      floor_price_24: first_of_the_day.floor_price,
      floor_price_7: first_of_last_7_days.floor_price,
      total_volume: statistic.total_volume,
      instant_volume: statistic.total_volume - previous_statistic.total_volume,
      day_volume: statistic.total_volume - first_of_last_7_days.total_volume,
      created_at: statistic.created_at,
      updated_at: statistic.updated_at,
    };

    console.timeLog(
      `${i}-${collection_name}-temp_statistics`,
      JSON.stringify(stat)
    );

    statistics_result.push(stat);

    console.timeEnd(`${i}-${collection_name}-temp_statistics`);
  }

  const st = new tempStatisticsModel({
    name: collection_name,
    statistics: statistics_result,
  });
  await st.save();

  console.timeEnd(feed_temp_statistics_for_collection_test.name);
  return;
};

const feed_temp_statistics = async () => {
  console.time(`start ${feed_temp_statistics.name}`);
  const collections = await collectionModel.find({}, { name: 1 });
  console.log("collections.length", collections.length);

  for (const c of collections) {
    console.time(`${c.name}`);
    await feed_temp_statistics_for_collection(c.name);
    console.timeEnd(`${c.name}`);
  }
  console.timeEnd(`start ${feed_temp_statistics.name}`);

  return;
};

const set_id = async () => {
  const transactions = [];
  const ts = await tempStatisticsModel.find();
  for (const t of ts) {
    for (let i = 0; i < t.statistics.length; i++) {
      const stat = t.statistics[i];

      trx = {
        updateOne: {
          filter: { _id: t._id },
          update: {
            $set: {
              "statistics.$[element]._id": new mongoose.Types.ObjectId(),
            },
          },
          arrayFilters: [{ "element.created_at": { $eq: stat.created_at } }],
          upsert: false,
        },
      };
      transactions.push(trx);
    }
  }

  const result = await tempStatisticsModel.bulkWrite(transactions);
};

set_id();

module.exports = { feed_temp_statistics };
