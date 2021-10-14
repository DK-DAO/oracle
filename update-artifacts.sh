#!/usr/bin/env bash

DIR_CURRENT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
DIR_INFRASTRUCTURE=$DIR_CURRENT/../infrastructure

SRC_ARTIFACTS=$DIR_CURRENT/../infrastructure/artifacts
SRC_TYPECHAIN=$DIR_CURRENT/../infrastructure/typechain

DST_TYPECHAIN=$DIR_CURRENT/typechain
DST_ARTIFACTS=$DIR_CURRENT/artifacts

cd $DIR_INFRASTRUCTURE
npm run build
cd $DIR_CURRENT

rm -f $DST_ARTIFACTS/*.json
rm -f $DST_TYPECHAIN/*.d.ts

cp $SRC_ARTIFACTS/contracts/dk/DuelistKingDistributor.sol/DuelistKingDistributor.json $DST_ARTIFACTS/
cp $SRC_ARTIFACTS/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json $DST_ARTIFACTS/
cp $SRC_ARTIFACTS/contracts/infrastructure/NFT.sol/NFT.json $DST_ARTIFACTS/
cp $SRC_ARTIFACTS/contracts/libraries/OracleProxy.sol/OracleProxy.json $DST_ARTIFACTS/
cp $SRC_ARTIFACTS/contracts/infrastructure/Registry.sol/Registry.json $DST_ARTIFACTS/
cp $SRC_ARTIFACTS/contracts/infrastructure/RNG.sol/RNG.json $DST_ARTIFACTS/

cp $SRC_TYPECHAIN/DuelistKingDistributor.d.ts $DST_TYPECHAIN/
cp $SRC_TYPECHAIN/ERC20.d.ts $DST_TYPECHAIN/
cp $SRC_TYPECHAIN/NFT.d.ts $DST_TYPECHAIN/
cp $SRC_TYPECHAIN/OracleProxy.d.ts $DST_TYPECHAIN/
cp $SRC_TYPECHAIN/Registry.d.ts $DST_TYPECHAIN/
cp $SRC_TYPECHAIN/RNG.d.ts $DST_TYPECHAIN/