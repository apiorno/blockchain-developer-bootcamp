const config = require('../src/config.json');
const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};

const wait = (seconds) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
async function main() {
  // Fetch accounts from wallet - these are unlocked
  const accounts = await ethers.getSigners();

  //Fetch network
  const { chainId } = await ethers.provider.getNetwork();
  console.log('Chain Id:', chainId);

  // Fetch deployed tokens
  const Dapp = await ethers.getContractAt(
    'Token',
    config[chainId]['Dapp']['address']
  );
  console.log(`Dapp Token fetched: ${Dapp.address}\n`);

  const mETH = await ethers.getContractAt(
    'Token',
    config[chainId]['mETH']['address']
  );
  console.log(`mETH Token fetched: ${mETH.address}\n`);

  const mDAI = await ethers.getContractAt(
    'Token',
    config[chainId]['mDAI']['address']
  );
  console.log(`mDAI Token fetched: ${mDAI.address}\n`);

  // Fetch deployed exchange
  const exchange = await ethers.getContractAt(
    'Exchange',
    config[chainId]['exchange']['address']
  );
  console.log(`Exchange fetched: ${exchange.address}\n`);

  // Give tokens to accounts[1]
  const sender = accounts[0];
  const receiver = accounts[1];
  const amount = tokens(10000);

  // user1 trasnfer 10,000 mETH...
  let transaction, result;
  transaction = await mETH.connect(sender).transfer(receiver.address, amount);
  await transaction.wait();
  console.log(
    `Transferred ${amount} mETH from ${sender.address} to ${receiver.address}`
  );

  // user1 approves 10,000 Dapp...
  transaction = await Dapp.connect(sender).approve(exchange.address, amount);
  await transaction.wait();
  console.log(`Aproved ${amount} Dapp tokens from ${sender.address}\n`);

  // user1 deposits 10,000 Dapp...
  transaction = await exchange
    .connect(sender)
    .depositToken(Dapp.address, amount);
  await transaction.wait();
  console.log(`Deposited ${amount} Dapp tokens from ${sender.address}\n`);

  // user2 approves 10,000 mETH...
  transaction = await mETH.connect(receiver).approve(exchange.address, amount);
  await transaction.wait();
  console.log(`Aproved ${amount} mETH tokens from ${receiver.address}\n`);

  // user2 deposits 10,000 mETH...
  transaction = await exchange
    .connect(receiver)
    .depositToken(mETH.address, amount);
  await transaction.wait();
  console.log(`Deposited ${amount} mETH tokens from ${receiver.address}\n`);

  //////////
  // Seed cancelled order

  // user1 creates a new order
  let orderId;
  transaction = await exchange
    .connect(sender)
    .makeOrder(mETH.address, tokens(100), Dapp.address, tokens(5));
  result = await transaction.wait();
  console.log(`New order created by ${sender.address}\n`);

  // user1 cancels the order
  orderId = result.events[0].args.id;
  transaction = await exchange.connect(sender).cancelOrder(orderId);
  result = await transaction.wait();
  console.log(`Order cancelled by ${sender.address}\n`);

  await wait(1);

  //////////
  // Seed filled order

  // user1 creates a new order
  transaction = await exchange
    .connect(sender)
    .makeOrder(mETH.address, tokens(100), Dapp.address, tokens(10));
  result = await transaction.wait();
  console.log(`New order created by ${sender.address}\n`);

  // user2 fills the order
  orderId = result.events[0].args.id;
  transaction = await exchange.connect(receiver).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Order filled by ${receiver.address}\n`);

  await wait(1);

  // user1 creates a new order
  transaction = await exchange
    .connect(sender)
    .makeOrder(mETH.address, tokens(50), Dapp.address, tokens(15));
  result = await transaction.wait();
  console.log(`New order created by ${sender.address}\n`);

  // user2 fills the order
  orderId = result.events[0].args.id;
  transaction = await exchange.connect(receiver).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Order filled by ${receiver.address}\n`);

  await wait(1);

  // user1 creates a new order
  transaction = await exchange
    .connect(sender)
    .makeOrder(mETH.address, tokens(200), Dapp.address, tokens(20));
  result = await transaction.wait();
  console.log(`New order created by ${sender.address}\n`);

  // user2 fills the order
  orderId = result.events[0].args.id;
  transaction = await exchange.connect(receiver).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Order filled by ${receiver.address}\n`);

  await wait(1);

  //////////
  // Seed open order

  // user1 and user2 create 10 orders each
  for (let i = 0; i < 10; i++) {
    transaction = await exchange
      .connect(sender)
      .makeOrder(mETH.address, tokens(10 * (i + 1)), Dapp.address, tokens(10));
    result = await transaction.wait();
    console.log(`New order created by ${sender.address}\n`);
    await wait(1);

    transaction = await exchange
      .connect(receiver)
      .makeOrder(Dapp.address, tokens(10), mETH.address, tokens(10 * (i + 1)));
    result = await transaction.wait();
    console.log(`New order created by ${receiver.address}\n`);
    await wait(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
