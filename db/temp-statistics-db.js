const collectionModel = require("./model/collection");
const tempStatisticsModel = require("./model/temp-statistics");

const feed_temp_statistics_for_collection = async (collection_name) => {
  console.log("collection_name", collection_name);
  let result_count = 1;
  let statistics_result = {};
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

    const temp_statistics = await collectionModel.aggregate(aggregation, {
      allowDiskUse: true,
    });

    console.log("keys: ", Object.keys(temp_statistics[0]));
    if (temp_statistics.length <= 0) {
      console.warn("no statistics found");
      result_count = 0;
      break;
    }
    const { statistics } = temp_statistics[0];

    console.log("statistics", statistics);
    statistics_result = { ...statistics, ...statistics_result };
    skip++;
  }

  const st = new tempStatisticsModel({
    name: collection_name,
    statistics: statistics_result,
  });
  await st.save();

  return;
};

const feed_temp_statistics = async () => {
  console.time(feed_temp_statistics.name);
  const collections = await collectionModel.find({}, { name: 1 });
  for (const c of collections) {
    console.time(c.name);
    await feed_temp_statistics_for_collection(c.name);
    console.timeEnd(c.name);
  }
  console.timeEnd(feed_temp_statistics.name);

  return;
};

module.exports = { feed_temp_statistics };
