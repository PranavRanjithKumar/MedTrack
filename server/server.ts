import path from 'path';
import dotenv from 'dotenv';
import { buildCCPOrg, buildWallet } from './utils/appUtils';
import { buildCAClient, enrollAdmin } from './utils/CAUtils';

dotenv.config({ path: './config.env' });

// eslint-disable-next-line import/first
import app from './app';

const port = process.env.PORT || 3000;

async function main() {
  const organizations = process.env.ORGANIZATIONS?.split(',');

  // register admins of all organizations
  (organizations as string[]).forEach(async (org) => {
    try {
      const walletPath = path.join(__dirname, '..', 'wallet', `${org}`);
      const mspOrg = `${org[0].toUpperCase()}${org.substring(1)}MSP`;

      // build an in memory object with the network configuration (also known as a connection profile)
      const ccp = buildCCPOrg(org);

      // build an instance of the fabric ca services client based on
      // the information in the network configuration
      const caClient = buildCAClient(ccp, `ca.${org}.${process.env.DOMAIN}`);

      // setup the wallet to hold the credentials of the application user
      const wallet = await buildWallet(walletPath);

      await enrollAdmin(caClient, wallet, mspOrg);
    } catch (error) {
      console.log(error);
    }
  });

  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    console.log(`Project directory ${__dirname}`);
  });
}

main();
