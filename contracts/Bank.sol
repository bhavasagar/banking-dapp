// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Bank {
    address owner;
    bytes32[] public whitelistedSymbols;
    mapping(bytes32 => address) public whitelistedTokens;
    mapping(address => mapping(bytes32 => uint256)) public balances;

    constructor() {
        owner = msg.sender;
    }

    function whitelistToken(bytes32 symbol, address tokenAddress) external {
        require(msg.sender == owner, "This isn't public");

        whitelistedSymbols.push(symbol);
        whitelistedTokens[symbol] = tokenAddress;
    }

    function getWhitelistedSymbols() external view returns(bytes32[] memory) {
        return whitelistedSymbols;
    }
    
    function getWhitelistedTokenAddress(bytes32 symbol) external view returns(address) {
        return whitelistedTokens[symbol];
    }

    receive() external payable {
        balances[msg.sender]['Eth'] += msg.value;        
    }

    function withdrawEther(uint amount) external {
        require(balances[msg.sender]['Eth'] >= amount, "InsufficientFunds");

        balances[msg.sender]['Eth'] -= amount;
        payable(msg.sender).call{value: amount}("");
    }

    function depositTokens(uint256 amount, bytes32 symbol) external {
        balances[msg.sender][symbol] += amount;
        IERC20(whitelistedTokens[symbol]).transferFrom(msg.sender, address(this), amount);
    }

    function withdrawToken(bytes32 symbol, uint256 amount) external {
        require(balances[msg.sender][symbol] >= amount, "InsufficientFunds");

        balances[msg.sender][symbol] -= amount;
        IERC20(whitelistedTokens[symbol]).transfer(msg.sender, amount);        
    }

    function getTokenBalance(bytes32 symbol) external view returns(uint256) {
        return balances[msg.sender][symbol];
    }


}