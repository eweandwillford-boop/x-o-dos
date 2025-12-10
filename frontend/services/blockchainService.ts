import { ethers } from 'ethers';
import XoDosAbi from '../abi/XoDos.json';

// Constants
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const POLYGON_MUMBAI_RPC = "https://rpc-mumbai.maticvigil.com";

let provider: ethers.providers.Web3Provider | null = null;
let signer: ethers.Signer | null = null;
let contract: ethers.Contract | null = null;

export const connectWallet = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  contract = new ethers.Contract(CONTRACT_ADDRESS, XoDosAbi, signer);

  return await signer.getAddress();
};

export const generateWalletAddress = (): string => {
  return "0x0000...0000"; // Placeholder until connected
};

export const generateContractAddress = (): string => CONTRACT_ADDRESS;

export const generateTxHash = (): string => "Pending...";

export const getCurrentBlockNumber = async (): Promise<number> => {
  if (!provider) return 0;
  return await provider.getBlockNumber();
};

export const estimateGasFee = async (): Promise<number> => {
  if (!provider) return 0;
  const fee = await provider.getGasPrice();
  return Number(ethers.utils.formatEther(fee));
};

export const waitForConfirmation = async (txHash?: string): Promise<void> => {
  if (!provider || !txHash) return;
  await provider.waitForTransaction(txHash);
};

export const getContract = () => contract;