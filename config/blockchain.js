const { ethers } = require('ethers');

let provider, signer, contract;

async function initializeBlockchain() {
  provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
  await provider.getNetwork();

  const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  signer = new ethers.Wallet(privateKey, provider);

  const deployment = require('../deployment.json');
  const contractABI = require('../contractABI.json');

  contract = new ethers.Contract(deployment.contractAddress, contractABI, signer);
  await contract.totalEvents();

  console.log('Blockchain initialized successfully');
  console.log('Contract address:', deployment.contractAddress);
  console.log('Signer address  :', signer.address);
}

function getContract()  { return contract; }
function getProvider()  { return provider; }
function getSigner()    { return signer; }

module.exports = { initializeBlockchain, getContract, getProvider, getSigner };
