# x-o-dos API

Express API for interacting with the x-o-dos smart contract.

## Configuration

Ensure the following environment variables are set in `.env` (copy from `.env.example`):

```env
PORT=3000
RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=deployed_contract_address
```

## Endpoints

### Tasks

- **POST /tasks**
  - Creates a new task on-chain.
  - Body: `{ "ipfsUri": "QmHash...", "reward": "100" }`
  - Returns: `{ "message": "...", "txHash": "0x...", "taskId": "1" }`

- **GET /tasks/:id**
  - Fetches task details from the contract.
  - If `ipfsUri` is present, attempts to fetch content from IPFS gateway.
  - Returns: 
    ```json
    {
      "id": "1",
      "creator": "0x...",
      "ipfsUri": "QmHash...",
      "reward": "100",
      "status": 0,
      "createdAt": "1234567890",
      "ipfsData": { ...resolved content... }
    }
    ```

### Users

- **GET /users/:address/tasks**
  - Returns list of task IDs created by the user.
  - Returns: `{ "tasks": ["1", "2"] }`

## Error Handling

- 503: Contract not connected (check env vars).
- 500: Internal server error or contract revert.
- 400: Missing parameters.

## Running

```bash
cd api
npm install
npm start
```
