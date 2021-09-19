# DKDAO Gaming Oracle

Oracle service

## Configuration

Please crete this file in the root folder of Oracle.

```env
NODE_ENV=staging

MARIADB_CONNECT_URL=mysql://<username>:<password>@<host or IP>:<port>/<database name>

RPC_POLYGON=<polygon_rpc_url>

ADDRESS_REGISTRY=<address_registry>

SALE_SCHEDULE_SALE=2021/08/20

ACTIVE_CHAIN_ID=137

DEVELOPMENT_CHAIN_ID=911

ACTIVE_CAMPAIGN_ID=1
```

You will need these information:

- `MARIADB_CONNECT_URL`: Database URL to your MariaDB, E.g: `mysql://root:password@localhost:3306/test_db`
- `RPC_POLYGON`: We will give you this information
- `ADDRESS_REGISTRY`: We will give you this information

## Installation

Clone the source code:

```txt
$ git clone https://github.com/DK-DAO/oracle.git
```

Make sure you are using version `v14.17.5` of Node.js

Install yarn and pm2:

```txt
$ npm i -g yarn pm2
```

Install dependencies and install:

```txt
~ $ cd oracle
~/oracle $ yarn install
~/oracle $ npm run build
~/oracle $ npm run knex:migrate
```

Start with PM2:

```txt
~/oracle $ pm2 start ./build/src/index.js
```
