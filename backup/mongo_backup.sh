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
 
$MONGODUMP_PATH -d $MONGO_DATABASE
 
mkdir -p $BACKUPS_DIR
mv dump $BACKUP_NAME
tar -zcvf $BACKUPS_DIR/$BACKUP_NAME.tgz $BACKUP_NAME
rm -rf $BACKUP_NAME