# DKDAO Gaming Oracle

Oracle service

## Configuration

Please create `.env` in the root folder of Oracle.

```env
NODE_ENV="development"

MARIADB_CONNECT_URL="mysql://<username>:<password>@<host or IP>:<port>/<database name>"

MARIADB_TABLE_PREFIX="duelist_"

WALLET_MNEMONIC=""

ACTIVE_PHASE="1"

SERVICE_BIND="http://0.0.0.0:1337"

RPC_0="https://rpc.testnet.fantom.network/?name=Fantom+Testnet&chainId=4002&nativeToken=FTM&registry=0x78b8cee29F7b837f680e61E48821Ee94aF062A6A&watching=0xAfdE21b0Cb49207eCA7BcDdAe1fD25Cc35467Cd5"

PRIV_ORACLE_DKDAO="0x..."

PRIV_ORACLE_DUELIST_KING="0x..."

REDIS_CONNECT_URL=redis://username:password@localhost:6379/

REDIS_CACHE_PATH=oracle
```

You will need these information:

## Installation

Clone the source code:

```txt
$ git clone https://github.com/DK-DAO/oracle.git
```

Make sure you are using version `v14.18.1` of Node.js

Install yarn and pm2:

```txt
$ npm i -g yarn pm2 knex
```

Install dependencies and install:

```txt
~ $ cd oracle
~/oracle $ yarn install
~/oracle $ npm run build
~/oracle $ knex migrate:latest
~/oracle $ knex seed:run
```

`knex seed:run` is necessary for the first time.
