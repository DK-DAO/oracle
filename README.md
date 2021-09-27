# DKDAO Gaming Oracle

Oracle service

## Configuration

Please crete this file in the root folder of Oracle.

```env
NODE_ENV=staging

MARIADB_CONNECT_URL=mysql://<username>:<password>@<host or IP>:<port>/<database name>

MARIADB_GAME_URL=mysql://<username>:<password>@<host or IP>:<port>/<game database name>

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

Create table in game database:

```sql
CREATE TABLE `dk_card` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `owner` varchar(42) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Owner of NFT token',
  `nftTokenId` varchar(66) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Token id of NFT',
  `applicationId` bigint(20) NOT NULL COMMENT 'Application Id of the item',
  `itemEdition` int(11) NOT NULL COMMENT 'Edition of the item',
  `itemGeneration` int(11) NOT NULL COMMENT 'Generation of the item',
  `itemRareness` int(11) NOT NULL COMMENT 'Rareness of the item',
  `itemType` int(11) NOT NULL COMMENT 'Type of the item',
  `itemId` bigint(20) NOT NULL COMMENT 'Id  of the item',
  `itemSerial` bigint(20) NOT NULL COMMENT 'Serial of the item',
  `transactionHash` varchar(66) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Transaction of the issuance',
  `createdDate` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Created date',
  `synced` tinyint(1) DEFAULT 0 COMMENT 'Is this row synced?',
  PRIMARY KEY (`id`),
  UNIQUE KEY `dk_card_nfttokenid_unique` (`nftTokenId`),
  KEY `indexed_fields` (`transactionHash`,`owner`,`nftTokenId`,`createdDate`),
  KEY `dk_card_synced_index` (`synced`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

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
