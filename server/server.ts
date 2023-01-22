import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { buildCCPOrg, buildWallet, getMSPId } from './utils/appUtils';
import { buildCAClient, enrollAdmin } from './utils/CAUtils';

dotenv.config({ path: './config.env' });

// eslint-disable-next-line import/first
import app from './app';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});

const port = process.env.PORT || 3000;

async function main() {
  const organizations = process.env.ORGANIZATIONS?.split(',');

  // register admins of all organizations
  (organizations as string[]).forEach(async (org) => {
    try {
      const mspOrg = getMSPId(org);

      const adminUserMail = process.env[`${org.toUpperCase()}_ADMIN`];

      // build an in memory object with the network configuration (also known as a connection profile)
      const ccp = await buildCCPOrg(org);

      // build an instance of the fabric ca services client based on
      // the information in the network configuration
      const caClient = buildCAClient(ccp, `ca.${org}.${process.env.DOMAIN}`);

      // setup the wallet to hold the credentials of the application user
      const wallet = await buildWallet();

      await enrollAdmin(caClient, wallet, mspOrg, adminUserMail);
    } catch (error) {
      console.log(error);
    }
  });

  mongoose
    .connect(process.env.DATABASE_LOCAL as string, { authSource: 'admin' })
    .then(() => console.log('DB connection successful!'));

  const server = app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    console.log(`Project directory ${__dirname}`);
  });

  process.on('unhandledRejection', (err: Error) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    });
  });
}

main();
