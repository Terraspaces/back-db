const collectionModel = require("./model/collection");
const tempStatisticsModel = require("./model/temp-statistics");

const feed_temp_statistics_for_collection = async (collection_name) => {
  console.time(feed_temp_statistics_for_collection.name);
  console.log("collection_name", collection_name);
  let result_count = 1;
  let statistics_result = [];
  let skip = 0;
  let limit = 100;

  while (result_count > 0) {
    const aggregation = [
      {
        $facet: {
          minMax: [
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
              $addFields: {
                firstDate: { $min: "$statistics.created_at" },
              },
            },
            {
              $unwind: "$statistics",
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
            {
              $addFields: {
                created_at_date: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$statistics.created_at",
                  },
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$statistics.created_at",
                  },
                },
                list: {
                  $push: "$$ROOT",
                },
                count: {
                  $sum: 1,
                },
              },
            },
            {
              $addFields: {
                min: {
                  $first: {
                    $filter: {
                      input: "$list.statistics",
                      cond: {
                        $eq: [
                          "$$this.created_at",
                          { $min: "$list.statistics.created_at" },
                        ],
                      },
                    },
                  },
                },
                max: {
                  $first: {
                    $filter: {
                      input: "$list.statistics",
                      cond: {
                        $eq: [
                          "$$this.created_at",
                          { $max: "$list.statistics.created_at" },
                        ],
                      },
                    },
                  },
                },
                minDate: { $min: "$list.statistics.created_at" },
                maxDate: { $max: "$list.statistics.created_at" },
                firstDate: { $max: "$list.firstDate" },
              },
            },
            {
              $project: {
                list: 0,
              },
            },
          ],
          list: [
            {
              $match: { name: collection_name },
            },
            {
              $project: {
                created_at: 0,
                updated_at: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: "$list",
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $addFields: {
          statistics: {
            $map: {
              input: "$list.statistics",
              as: "stat",
              in: {
                total_items: "$$stat.total_items",
                total_listed: "$$stat.total_listed",
                total_owners: "$$stat.total_owners",
                total_volume: "$$stat.total_volume",
                floor_price: "$$stat.floor_price",
                floor_price: "$$stat.floor_price",
                created_at: "$$stat.created_at",
                created_at_date: {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$$stat.created_at",
                      },
                    },
                    "",
                  ],
                },
                floor_price_24: {
                  $getField: {
                    field: "floor_price",
                    input: {
                      $arrayElemAt: [
                        "$list.statistics",
                        {
                          $indexOfArray: [
                            "$list.statistics.created_at",
                            {
                              $getField: {
                                field: "minDate",
                                input: {
                                  $arrayElemAt: [
                                    "$minMax",
                                    {
                                      $indexOfArray: [
                                        "$minMax._id",
                                        {
                                          $dateToString: {
                                            format: "%Y-%m-%d",
                                            date: "$$stat.created_at",
                                          },
                                        },
                                      ],
                                    },
                                  ],
                                },
                              },
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
                floor_price_7: {
                  $getField: {
                    field: "floor_price",
                    input: {
                      $getField: {
                        field: "min",
                        input: {
                          $max: {
                            $filter: {
                              input: "$minMax",
                              cond: {
                                $and: [
                                  {
                                    $lte: [
                                      "$$this.minDate",
                                      {
                                        $cond: {
                                          if: {
                                            $lte: [
                                              {
                                                $dateSubtract: {
                                                  startDate:
                                                    "$$stat.created_at",
                                                  unit: "week",
                                                  amount: 1,
                                                },
                                              },
                                              {
                                                $getField: {
                                                  field: "firstDate",
                                                  input: {
                                                    $arrayElemAt: [
                                                      "$minMax",
                                                      {
                                                        $indexOfArray: [
                                                          "$minMax._id",
                                                          {
                                                            $dateToString: {
                                                              format:
                                                                "%Y-%m-%d",
                                                              date: "$$stat.created_at",
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    ],
                                                  },
                                                },
                                              },
                                            ],
                                          },
                                          then: {
                                            $getField: {
                                              field: "firstDate",
                                              input: {
                                                $arrayElemAt: [
                                                  "$minMax",
                                                  {
                                                    $indexOfArray: [
                                                      "$minMax._id",
                                                      {
                                                        $dateToString: {
                                                          format: "%Y-%m-%d",
                                                          date: "$$stat.created_at",
                                                        },
                                                      },
                                                    ],
                                                  },
                                                ],
                                              },
                                            },
                                          },
                                          else: {
                                            $dateSubtract: {
                                              startDate: "$$stat.created_at",
                                              unit: "week",
                                              amount: 1,
                                            },
                                          },
                                        },
                                      },
                                    ],
                                  },
                                  {
                                    $lte: [
                                      "$$this.maxDate",
                                      {
                                        $cond: {
                                          if: {
                                            $lt: [
                                              {
                                                $dateSubtract: {
                                                  startDate:
                                                    "$$stat.created_at",
                                                  unit: "day",
                                                  amount: 6,
                                                },
                                              },
                                              {
                                                $getField: {
                                                  field: "firstDate",
                                                  input: {
                                                    $arrayElemAt: [
                                                      "$minMax",
                                                      {
                                                        $indexOfArray: [
                                                          "$minMax._id",
                                                          {
                                                            $dateToString: {
                                                              format:
                                                                "%Y-%m-%d",
                                                              date: "$$stat.created_at",
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    ],
                                                  },
                                                },
                                              },
                                            ],
                                          },
                                          then: {
                                            $getField: {
                                              field: "firstDate",
                                              input: {
                                                $arrayElemAt: [
                                                  "$minMax",
                                                  {
                                                    $indexOfArray: [
                                                      "$minMax._id",
                                                      {
                                                        $dateToString: {
                                                          format: "%Y-%m-%d",
                                                          date: "$$stat.created_at",
                                                        },
                                                      },
                                                    ],
                                                  },
                                                ],
                                              },
                                            },
                                          },
                                          else: {
                                            $dateSubtract: {
                                              startDate: "$$stat.created_at",
                                              unit: "day",
                                              amount: 6,
                                            },
                                          },
                                        },
                                      },
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                day_volume: {
                  $subtract: [
                    "$$stat.total_volume",
                    {
                      $getField: {
                        field: "total_volume",
                        input: {
                          $arrayElemAt: [
                            "$list.statistics",
                            {
                              $indexOfArray: [
                                "$list.statistics.created_at",
                                {
                                  $getField: {
                                    field: "minDate",
                                    input: {
                                      $arrayElemAt: [
                                        "$minMax",
                                        {
                                          $indexOfArray: [
                                            "$minMax._id",
                                            {
                                              $dateToString: {
                                                format: "%Y-%m-%d",
                                                date: "$$stat.created_at",
                                              },
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
                instant_volume: {
                  $subtract: [
                    "$$stat.total_volume",
                    {
                      $getField: {
                        field: "total_volume",
                        input: {
                          $arrayElemAt: [
                            "$list.statistics",
                            {
                              $cond: {
                                if: {
                                  $lt: [
                                    {
                                      $indexOfArray: [
                                        "$list.statistics",
                                        "$$stat",
                                      ],
                                    },
                                    1,
                                  ],
                                },
                                then: {
                                  $indexOfArray: ["$list.statistics", "$$stat"],
                                },
                                else: {
                                  $subtract: [
                                    {
                                      $indexOfArray: [
                                        "$list.statistics",
                                        "$$stat",
                                      ],
                                    },
                                    1,
                                  ],
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: { list: 0, minMax: 0 },
      },
    ];

    const temp_statistics_cursor = await collectionModel
      .aggregate(aggregation, {
        allowDiskUse: true,
      })
      .cursor();

    if (temp_statistics.length <= 0) {
      console.warn("no statistics found");
      result_count = 0;
      break;
    }
    const { statistics } = temp_statistics[0];
    if (statistics.length <= 0) {
      console.warn("no statistics found");
      result_count = 0;
      break;
    }

    console.log("statistics.length", statistics.length);
    statistics_result = statistics_result.concat(statistics);
    console.log("statistics_result.length", statistics_result.length);
    skip++;
  }

  const st = new tempStatisticsModel({
    name: collection_name,
    statistics: statistics_result,
  });
  await st.save();

  console.timeEnd(feed_temp_statistics_for_collection.name);
  return;
};

const feed_temp_statistics_for_collection_test = async (collection_name) => {
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
      i > 0 ? temp_statistics[i - 1] : temp_statistics[i];

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
      // TODO: improve fallback
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
      // TODO: improve fallback
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
    await feed_temp_statistics_for_collection_test(c.name);
    // await feed_temp_statistics_for_collection(c.name);
    console.timeEnd(`${c.name}`);
  }
  console.timeEnd(`start ${feed_temp_statistics.name}`);

  return;
};

module.exports = { feed_temp_statistics };
