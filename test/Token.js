const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};
describe('Token', () => {
  let token, accounts, deployer, receiver;
  beforeEach(async () => {
    //Fetch Token from Blockchain
    const Token = await ethers.getContractFactory('Token');
    token = await Token.deploy('Dapp University', 'DAPP', 1000000);

    accounts = await ethers.getSigners();
    deployer = accounts[0];
    receiver = accounts[1];
    exchange = accounts[2];
  });

  describe('Deployment', async () => {
    const name = 'Dapp University';
    const symbol = 'DAPP';
    const decimals = '18';
    const totalSupply = tokens(1000000);
    it('has correct name', async () => {
      expect(await token.name()).to.equal(name);
    });
    it('has correct symbol', async () => {
      expect(await token.symbol()).to.equal(symbol);
    });
    it('has correct decimals', async () => {
      expect(await token.decimals()).to.equal(decimals);
    });
    it('has correct total supply', async () => {
      expect(await token.totalSupply()).to.equal(totalSupply);
    });
    it('assigns total supply to deployer', async () => {
      expect(await token.balanceOf(deployer.address)).to.equal(totalSupply);
    });
  });

  describe('Sending Tokens', () => {
    let amount, transaction, result;

    describe('Success', () => {
      beforeEach(async () => {
        amount = tokens(100);
        transaction = await token
          .connect(deployer)
          .transfer(receiver.address, amount);
        result = await transaction.wait();
      });
      it('Transfer token balacnes', async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        );
        expect(await token.balanceOf(receiver.address)).to.equal(amount);
      });
      it('Emits Transfer Event', async () => {
        const log = result.events[0];
        expect(log.event).to.equal('Transfer');
        const event = log.args;
        expect(event.from).to.equal(deployer.address);
        expect(event.to).to.equal(receiver.address);
        expect(event.value).to.equal(amount);
      });
    });

    describe('Failure', async () => {
      it('Rejects Insufficient Balances', async () => {
        amount = tokens(100000000);
        await expect(
          token.connect(deployer).transfer(receiver.address, amount)
        ).to.be.revertedWith('Insufficient balance');
      });

      it('Rejects Invalid Recipients', async () => {
        amount = tokens(100);
        await expect(
          token
            .connect(deployer)
            .transfer('0x0000000000000000000000000000000000000000', amount)
        ).to.be.revertedWith('Invalid address');
      });
    });
  });

  describe('Approving Tokens', () => {
    let amount, transaction, result;
    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, amount);
      result = await transaction.wait();
    });
    describe('Success', () => {
      it('Allocates an allowance for delegated token spending', async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.equal(amount);
      });
      it('Emits Approval Event', async () => {
        const log = result.events[0];
        expect(log.event).to.equal('Approval');
        const event = log.args;
        expect(event.owner).to.equal(deployer.address);
        expect(event.spender).to.equal(exchange.address);
        expect(event.value).to.equal(amount);
      });
    });
    describe('Failure', () => {
      it('Rejects Invalid Recipients', async () => {
        await expect(
          token
            .connect(deployer)
            .approve('0x0000000000000000000000000000000000000000', amount)
        ).to.be.revertedWith('Invalid address');
      });
    });
  });

  describe('Delegated Token Transfers', () => {
    let amount, transaction, result;
    beforeEach(async () => {
      amount = tokens(100);
      transaction = await token
        .connect(deployer)
        .approve(exchange.address, amount);
      result = await transaction.wait();
    });

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await token
          .connect(exchange)
          .transferFrom(deployer.address, receiver.address, amount);
        result = await transaction.wait();
      });

      it('Transfer token balances', async () => {
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        );
        expect(await token.balanceOf(receiver.address)).to.equal(amount);
      });
      it('Resets the allowance', async () => {
        expect(
          await token.allowance(deployer.address, exchange.address)
        ).to.equal(0);
      });
      it('Emits Transfer Event', async () => {
        const log = result.events[0];
        expect(log.event).to.equal('Transfer');
        const event = log.args;
        expect(event.from).to.equal(deployer.address);
        expect(event.to).to.equal(receiver.address);
        expect(event.value).to.equal(amount);
      });
    });

    describe('Failure', () => {
      it('Rejects insufficient amounts', async () => {
        const invalidAmount = tokens(100000000);
        await expect(
          token
            .connect(exchange)
            .transferFrom(deployer.address, receiver.address, invalidAmount)
        ).to.be.revertedWith('Insufficient allowance');
      });
    });
  });
});
