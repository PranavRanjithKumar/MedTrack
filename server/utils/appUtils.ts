import { Request } from 'express';
import { Gateway, GatewayOptions, Wallet, Wallets } from 'fabric-network';
import * as fs from 'fs';
import * as path from 'path';
import AppError from './AppError';

const getMSPId = (org: string) => `${org}MSP`;

const buildCCPOrg = (org: string): Record<string, any> => {
  // load the common connection configuration file
  const ccpPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'organizations',
    'peerOrganizations',
    `${org}.${process.env.DOMAIN}`,
    `connection-${org}.json`
  );
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');

  // build a JSON object from the file contents
  const ccp = JSON.parse(contents);

  console.log(`Loaded the network configuration located at ${ccpPath}`);

  return ccp;
};

const buildWalletPath = (org: string) => {
  const walletPath = path.join(__dirname, '..', '..', 'wallet', org);
  return walletPath;
};

const buildWallet = async (org: string): Promise<Wallet> => {
  // Create a new  wallet : Note that wallet is for managing identities.
  let wallet: Wallet;
  const walletPath = buildWalletPath(org);
  if (walletPath) {
    wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Built a file system wallet at ${walletPath}`);
  } else {
    wallet = await Wallets.newInMemoryWallet();
    console.log('Built an in memory wallet');
  }

  return wallet;
};

const connectToGateway = async (req: Request) => {
  const gateway = new Gateway();

  let ccp;
  let userId;
  let orgType;

  if (req.user && req.user.organization && 'type' in req.user.organization) {
    orgType = req.user.organization.type;
  }

  const wallet = await buildWallet(orgType as string);

  if (req.user && req.user.role === 'admin') userId = 'admin';
  else userId = req.user?.email;

  // using asLocalhost as this gateway is using a fabric network deployed locally };
  const gatewayOpts: GatewayOptions = {
    wallet,
    identity: userId as string,
    discovery: { enabled: true, asLocalhost: true },
  };

  if (req.user && req.user.organization && 'type' in req.user.organization) {
    ccp = buildCCPOrg(req.user.organization.type);
  }

  // setup the gateway instance
  // The user will now be able to create connections to the fabric network and be able to
  // submit transactions and query. All transactions submitted by this gateway will be
  // signed by this user using the credentials stored in the wallet.

  console.log(gateway);

  try {
    await gateway.connect(ccp as Record<string, unknown>, gatewayOpts);

    const network = await gateway.getNetwork(process.env.HLF_CHANNEL as string);

    return { gateway, network };
  } catch (e) {
    console.log(e);
    throw new AppError(`Couldn't connect to the network!`, 500);
  }
};

export { getMSPId, buildCCPOrg, buildWallet, connectToGateway };
