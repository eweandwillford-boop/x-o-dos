const { ethers } = require('ethers');

// Human-Readable ABI
const ABI = [
    "function createTask(string ipfsUri, uint256 reward) external payable returns (uint256)",
    "function tasks(uint256) view returns (uint256 id, address creator, string ipfsUri, uint256 reward, uint8 status, uint256 createdAt)",
    "function getTasksByUser(address user) view returns (uint256[])",
    "event TaskCreated(uint256 indexed id, address indexed creator, string ipfsUri, uint256 reward)"
];

class ContractService {
    constructor() {
        this.rpcUrl = process.env.RPC_URL || process.env.POLYGON_RPC_URL;
        this.privateKey = process.env.PRIVATE_KEY;
        this.contractAddress = process.env.CONTRACT_ADDRESS;

        if (!this.rpcUrl || !this.privateKey || !this.contractAddress) {
            console.warn("Missing blockchain env vars (RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS)");
        }

        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        this.contract = new ethers.Contract(this.contractAddress, ABI, this.wallet);
    }

    async createTask(ipfsUri, reward) {
        try {
            // Note: In production, you might want to handle gas limits/prices more carefully
            // Reward is passed as a value if using native token, or just an argument if logic handles it differently
            // The contract definition: createTask(string calldata ipfsUri, uint256 reward) external payable

            const tx = await this.contract.createTask(ipfsUri, reward);
            const receipt = await tx.wait();

            // Find TaskCreated event
            const event = receipt.logs.find(log => {
                // Simple check, in prod use interface parsing
                return true;
            });

            // For now, return the transaction hash. Parsing the return value from logs usually requires interface.
            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error("Error creating task:", error);
            throw error;
        }
    }

    async getTask(id) {
        try {
            const task = await this.contract.tasks(id);
            // Format the output
            return {
                id: task.id.toString(),
                creator: task.creator,
                ipfsUri: task.ipfsUri,
                reward: task.reward.toString(),
                status: ["Open", "InProgress", "Completed", "Cancelled"][task.status],
                createdAt: new Date(Number(task.createdAt) * 1000).toISOString()
            };
        } catch (error) {
            console.error(`Error fetching task ${id}:`, error);
            throw error;
        }
    }

    async getTasksByUser(address) {
        try {
            const taskIds = await this.contract.getTasksByUser(address);
            return taskIds.map(id => id.toString());
        } catch (error) {
            console.error(`Error fetching tasks for user ${address}:`, error);
            throw error;
        }
    }
}

module.exports = new ContractService();
