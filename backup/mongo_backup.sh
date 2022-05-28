#!/bin/bash
set -e
set -u

if [ -f .env ]; then
    source .env
else
    echo ".env file not found"
fi

MONGODB_USER=$MONGODB_USER
MONGODB_PASS=$MONGODB_PASS
MONGODB_HOST=$MONGODB_HOST
MONGODB_PORT=$MONGODB_PORT
MONGODB_DB=$MONGODB_DB

TIMESTAMP=`date +%F-%H%M`
MONGODUMP_PATH="$pwd/mongodump"
MONGODUMP_PATH="/usr/bin/mongodump"
BACKUPS_DIR="$pwd/backups"
BACKUP_NAME="$MONGODB_DB-$TIMESTAMP"
 
# mongo admin --eval "printjson(db.fsyncLock())"
# $MONGODUMP_PATH -h $MONGO_HOST:$MONGO_PORT -d $MONGO_DATABASE
$MONGODUMP_PATH -d $MONGO_DATABASE
# mongo admin --eval "printjson(db.fsyncUnlock())"
 
mkdir -p $BACKUPS_DIR
mv dump $BACKUP_NAME
tar -zcvf $BACKUPS_DIR/$BACKUP_NAME.tgz $BACKUP_NAME
rm -rf $BACKUP_NAME