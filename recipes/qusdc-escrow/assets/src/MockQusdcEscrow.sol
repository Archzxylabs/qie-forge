// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.37;

/// @notice Local-only ERC-20-like fixture. It is not QUSDC or WUSDC.
contract MockToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    address public minter;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory tokenName, string memory tokenSymbol, uint8 tokenDecimals) {
        name = tokenName;
        symbol = tokenSymbol;
        decimals = tokenDecimals;
        minter = msg.sender;
    }

    function setMinter(address nextMinter) external {
        require(msg.sender == minter, "not minter");
        minter = nextMinter;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "not minter");
        balanceOf[to] += amount;
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == minter, "not minter");
        require(balanceOf[from] >= amount, "balance");
        balanceOf[from] -= amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "balance");
        uint256 permitted = allowance[from][msg.sender];
        require(permitted >= amount, "allowance");
        allowance[from][msg.sender] = permitted - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @notice Local mock of the documented WUSDC -> QUSDC vault shape.
/// @dev This contract is a teaching fixture and not a production implementation.
contract MockQusdcVault {
    MockToken public immutable wusdc;
    MockToken public immutable qusdc;

    constructor(MockToken inputToken, MockToken receiptToken) {
        wusdc = inputToken;
        qusdc = receiptToken;
    }

    function depositAndMint(uint256 amount) external {
        require(amount > 0, "amount");
        require(wusdc.transferFrom(msg.sender, address(this), amount), "input transfer");
        qusdc.mint(msg.sender, amount);
    }

    function burnAndWithdraw(uint256 amount) external {
        require(amount > 0, "amount");
        qusdc.burn(msg.sender, amount);
        require(wusdc.transfer(msg.sender, amount), "output transfer");
    }
}

/// @notice A minimal escrow that accounts in the mock receipt token's raw units.
contract MockQusdcEscrow {
    MockToken public immutable asset;
    mapping(address => uint256) public deposited;
    mapping(address => uint256) public claimable;
    bool public paused;

    constructor(MockToken escrowAsset) {
        asset = escrowAsset;
    }

    function setPaused(bool nextPaused) external {
        paused = nextPaused;
    }

    function deposit(uint256 amount) external {
        require(!paused, "paused");
        require(amount > 0, "amount");
        require(asset.transferFrom(msg.sender, address(this), amount), "deposit transfer");
        deposited[msg.sender] += amount;
    }

    function award(address recipient, uint256 amount) external {
        require(deposited[recipient] >= amount, "not deposited");
        claimable[recipient] += amount;
    }

    function claim() external {
        uint256 amount = claimable[msg.sender];
        require(amount > 0, "nothing claimable");
        claimable[msg.sender] = 0;
        require(asset.transfer(msg.sender, amount), "claim transfer");
    }
}
