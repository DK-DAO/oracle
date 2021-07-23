/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import { TypedEventFilter, TypedEvent, TypedListener } from "./commons";

interface RNGInterface extends ethers.utils.Interface {
  functions: {
    "batchCommit(bytes)": FunctionFragment;
    "commit(bytes32)": FunctionFragment;
    "getDataByDigest(bytes32)": FunctionFragment;
    "getDataByIndex(uint256)": FunctionFragment;
    "getDomain()": FunctionFragment;
    "getProgess()": FunctionFragment;
    "getRegistry()": FunctionFragment;
    "reveal(bytes)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "batchCommit",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "commit", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "getDataByDigest",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getDataByIndex",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "getDomain", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getProgess",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getRegistry",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "reveal", values: [BytesLike]): string;

  decodeFunctionResult(
    functionFragment: "batchCommit",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "commit", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getDataByDigest",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getDataByIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getDomain", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getProgess", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getRegistry",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "reveal", data: BytesLike): Result;

  events: {
    "Committed(uint256,bytes32)": EventFragment;
    "Revealed(uint256,uint256,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Committed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Revealed"): EventFragment;
}

export class RNG extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  listeners(eventName?: string): Array<Listener>;
  off(eventName: string, listener: Listener): this;
  on(eventName: string, listener: Listener): this;
  once(eventName: string, listener: Listener): this;
  removeListener(eventName: string, listener: Listener): this;
  removeAllListeners(eventName?: string): this;

  listeners<T, G>(
    eventFilter?: TypedEventFilter<T, G>
  ): Array<TypedListener<T, G>>;
  off<T, G>(
    eventFilter: TypedEventFilter<T, G>,
    listener: TypedListener<T, G>
  ): this;
  on<T, G>(
    eventFilter: TypedEventFilter<T, G>,
    listener: TypedListener<T, G>
  ): this;
  once<T, G>(
    eventFilter: TypedEventFilter<T, G>,
    listener: TypedListener<T, G>
  ): this;
  removeListener<T, G>(
    eventFilter: TypedEventFilter<T, G>,
    listener: TypedListener<T, G>
  ): this;
  removeAllListeners<T, G>(eventFilter: TypedEventFilter<T, G>): this;

  queryFilter<T, G>(
    event: TypedEventFilter<T, G>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEvent<T & G>>>;

  interface: RNGInterface;

  functions: {
    batchCommit(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "batchCommit(bytes)"(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    commit(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "commit(bytes32)"(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    getDataByDigest(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, string, string] & {
          index: BigNumber;
          digest: string;
          secret: string;
        }
      ]
    >;

    "getDataByDigest(bytes32)"(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, string, string] & {
          index: BigNumber;
          digest: string;
          secret: string;
        }
      ]
    >;

    getDataByIndex(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, string, string] & {
          index: BigNumber;
          digest: string;
          secret: string;
        }
      ]
    >;

    "getDataByIndex(uint256)"(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [
        [BigNumber, string, string] & {
          index: BigNumber;
          digest: string;
          secret: string;
        }
      ]
    >;

    getDomain(overrides?: CallOverrides): Promise<[string]>;

    "getDomain()"(overrides?: CallOverrides): Promise<[string]>;

    getProgess(
      overrides?: CallOverrides
    ): Promise<
      [[BigNumber, BigNumber] & { remaining: BigNumber; total: BigNumber }]
    >;

    "getProgess()"(
      overrides?: CallOverrides
    ): Promise<
      [[BigNumber, BigNumber] & { remaining: BigNumber; total: BigNumber }]
    >;

    getRegistry(overrides?: CallOverrides): Promise<[string]>;

    "getRegistry()"(overrides?: CallOverrides): Promise<[string]>;

    reveal(
      data: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "reveal(bytes)"(
      data: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;
  };

  batchCommit(
    digest: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "batchCommit(bytes)"(
    digest: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  commit(
    digest: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "commit(bytes32)"(
    digest: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  getDataByDigest(
    digest: BytesLike,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, string, string] & {
      index: BigNumber;
      digest: string;
      secret: string;
    }
  >;

  "getDataByDigest(bytes32)"(
    digest: BytesLike,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, string, string] & {
      index: BigNumber;
      digest: string;
      secret: string;
    }
  >;

  getDataByIndex(
    index: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, string, string] & {
      index: BigNumber;
      digest: string;
      secret: string;
    }
  >;

  "getDataByIndex(uint256)"(
    index: BigNumberish,
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, string, string] & {
      index: BigNumber;
      digest: string;
      secret: string;
    }
  >;

  getDomain(overrides?: CallOverrides): Promise<string>;

  "getDomain()"(overrides?: CallOverrides): Promise<string>;

  getProgess(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber] & { remaining: BigNumber; total: BigNumber }
  >;

  "getProgess()"(
    overrides?: CallOverrides
  ): Promise<
    [BigNumber, BigNumber] & { remaining: BigNumber; total: BigNumber }
  >;

  getRegistry(overrides?: CallOverrides): Promise<string>;

  "getRegistry()"(overrides?: CallOverrides): Promise<string>;

  reveal(data: BytesLike, overrides?: Overrides): Promise<ContractTransaction>;

  "reveal(bytes)"(
    data: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  callStatic: {
    batchCommit(digest: BytesLike, overrides?: CallOverrides): Promise<boolean>;

    "batchCommit(bytes)"(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<boolean>;

    commit(digest: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    "commit(bytes32)"(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDataByDigest(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, string] & {
        index: BigNumber;
        digest: string;
        secret: string;
      }
    >;

    "getDataByDigest(bytes32)"(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, string] & {
        index: BigNumber;
        digest: string;
        secret: string;
      }
    >;

    getDataByIndex(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, string] & {
        index: BigNumber;
        digest: string;
        secret: string;
      }
    >;

    "getDataByIndex(uint256)"(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, string, string] & {
        index: BigNumber;
        digest: string;
        secret: string;
      }
    >;

    getDomain(overrides?: CallOverrides): Promise<string>;

    "getDomain()"(overrides?: CallOverrides): Promise<string>;

    getProgess(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { remaining: BigNumber; total: BigNumber }
    >;

    "getProgess()"(
      overrides?: CallOverrides
    ): Promise<
      [BigNumber, BigNumber] & { remaining: BigNumber; total: BigNumber }
    >;

    getRegistry(overrides?: CallOverrides): Promise<string>;

    "getRegistry()"(overrides?: CallOverrides): Promise<string>;

    reveal(data: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    "reveal(bytes)"(
      data: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {
    Committed(
      index: BigNumberish | null,
      digest: BytesLike | null
    ): TypedEventFilter<
      [BigNumber, string],
      { index: BigNumber; digest: string }
    >;

    Revealed(
      index: BigNumberish | null,
      s: BigNumberish | null,
      t: BigNumberish | null
    ): TypedEventFilter<
      [BigNumber, BigNumber, BigNumber],
      { index: BigNumber; s: BigNumber; t: BigNumber }
    >;
  };

  estimateGas: {
    batchCommit(digest: BytesLike, overrides?: Overrides): Promise<BigNumber>;

    "batchCommit(bytes)"(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    commit(digest: BytesLike, overrides?: Overrides): Promise<BigNumber>;

    "commit(bytes32)"(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    getDataByDigest(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getDataByDigest(bytes32)"(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDataByIndex(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    "getDataByIndex(uint256)"(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getDomain(overrides?: CallOverrides): Promise<BigNumber>;

    "getDomain()"(overrides?: CallOverrides): Promise<BigNumber>;

    getProgess(overrides?: CallOverrides): Promise<BigNumber>;

    "getProgess()"(overrides?: CallOverrides): Promise<BigNumber>;

    getRegistry(overrides?: CallOverrides): Promise<BigNumber>;

    "getRegistry()"(overrides?: CallOverrides): Promise<BigNumber>;

    reveal(data: BytesLike, overrides?: Overrides): Promise<BigNumber>;

    "reveal(bytes)"(data: BytesLike, overrides?: Overrides): Promise<BigNumber>;
  };

  populateTransaction: {
    batchCommit(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "batchCommit(bytes)"(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    commit(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "commit(bytes32)"(
      digest: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    getDataByDigest(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getDataByDigest(bytes32)"(
      digest: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDataByIndex(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "getDataByIndex(uint256)"(
      index: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getDomain(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "getDomain()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getProgess(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "getProgess()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getRegistry(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "getRegistry()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    reveal(
      data: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "reveal(bytes)"(
      data: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;
  };
}