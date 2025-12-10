// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract XoDos {
    struct Task {
        uint256 id;
        address creator;
        string description; // IPFS hash or URI
        uint256 reward;
        bool completed;
        address assignee;
    }

    mapping(uint256 => Task) public tasks;
    uint256 public taskCount;

    event TaskCreated(uint256 id, address creator, uint256 reward, string description);
    event TaskCompleted(uint256 id, address assignee);

    function createTask(string memory _description) public payable {
        require(msg.value > 0, "Reward must be greater than 0");

        taskCount++;
        tasks[taskCount] = Task(
            taskCount,
            msg.sender,
            _description,
            msg.value,
            false,
            address(0)
        );

        emit TaskCreated(taskCount, msg.sender, msg.value, _description);
    }

    // Simplified completion logic: Any user can complete an open task and claim the reward.
    // In a real scenario, the creator might need to approve the completion.
    function completeTask(uint256 _id) public {
        Task storage task = tasks[_id];
        require(_id > 0 && _id <= taskCount, "Task does not exist");
        require(!task.completed, "Task is already completed");
        require(task.creator != msg.sender, "Creator cannot complete their own task");

        task.completed = true;
        task.assignee = msg.sender;

        (bool success, ) = payable(msg.sender).call{value: task.reward}("");
        require(success, "Transfer failed");

        emit TaskCompleted(_id, msg.sender);
    }

    function getTasksByUser(address _user) public view returns (uint256[] memory) {
        uint256[] memory userTaskIds = new uint256[](taskCount);
        uint256 counter = 0;
        for (uint256 i = 1; i <= taskCount; i++) {
            if (tasks[i].creator == _user || tasks[i].assignee == _user) {
                userTaskIds[counter] = i;
                counter++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](counter);
        for (uint256 i = 0; i < counter; i++) {
            result[i] = userTaskIds[i];
        }
        return result;
    }
}
