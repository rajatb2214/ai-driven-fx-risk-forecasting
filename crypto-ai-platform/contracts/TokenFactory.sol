// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LaunchToken is ERC20 {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupply,
        address owner
    ) ERC20(tokenName, tokenSymbol) {
        _mint(owner, initialSupply * 10 ** decimals());
    }
}

contract TokenFactory {
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 supply
    );

    address[] public launchedTokens;

    function createToken(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupply
    ) external returns (address) {
        LaunchToken token = new LaunchToken(tokenName, tokenSymbol, initialSupply, msg.sender);
        launchedTokens.push(address(token));
        emit TokenCreated(address(token), msg.sender, tokenName, tokenSymbol, initialSupply);
        return address(token);
    }

    function totalLaunchedTokens() external view returns (uint256) {
        return launchedTokens.length;
    }
}
