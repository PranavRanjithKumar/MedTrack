import { Request } from 'express';
import FabricCAServices, { IKeyValueAttribute } from 'fabric-ca-client';
import { Wallet } from 'fabric-network';
import AppError from './AppError';
import { buildCCPOrg, buildWallet, getMSPId } from './appUtils';

const buildCAClient = (
  ccp: Record<string, any>,
  caHostName: string
): FabricCAServices => {
  // Create a new CA client for interacting with the CA.
  const caInfo = ccp.certificateAuthorities[caHostName]; // lookup CA details from config
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  const caClient = new FabricCAServices(
    caInfo.url,
    { trustedRoots: caTLSCACerts, verify: false },
    caInfo.caName
  );

  console.log(`Built a CA Client named ${caInfo.caName}`);
  return caClient;
};

const enrollAdmin = async (
  caClient: FabricCAServices,
  wallet: Wallet,
  orgMspId: string,
  adminUserMail: string | undefined
): Promise<void> => {
  try {
    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get(adminUserMail as string);
    if (identity) {
      console.log(
        'An identity for the admin user already exists in the wallet'
      );
      return;
    }
    console.log('Trying to enroll the admin user!');

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await caClient.enroll({
      enrollmentID: adminUserMail as string,
      enrollmentSecret: process.env.FABRIC_CA_ADMIN_PASS as string,
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: orgMspId,
      type: 'X.509',
    };
    await wallet.put(adminUserMail as string, x509Identity);
    console.log(
      'Successfully enrolled admin user and imported it into the wallet'
    );
  } catch (error) {
    console.error(`Failed to enroll admin user : ${error}`);
  }
};

const registerAndEnrollUser = async (
  caClient: FabricCAServices,
  org: string,
  adminUserId: string,
  newUserId: string,
  role: string,
  userAttributes: IKeyValueAttribute[],
  affiliation: string
): Promise<void> => {
  const orgMspId = getMSPId(org);
  // setup the wallet to hold the credentials of the application user
  const wallet = await buildWallet(org);

  // Check to see if we've already enrolled the user
  const userIdentity = await wallet.get(newUserId);
  if (userIdentity) {
    throw new AppError('An identity with this userId already exists!', 400);
  }

  // Must use an admin to register a new user
  const adminIdentity = await wallet.get(adminUserId);
  if (!adminIdentity) {
    throw new AppError(
      'An identity for this admin user does not exist in the wallet',
      400
    );
  }

  // build a user object for authenticating with the CA
  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, adminUserId);

  console.log(`The admin user is affiliated to: ${adminUser.getAffiliation()}`);

  // Register the user, enroll the user, and import the new identity into the wallet.
  // if affiliation is specified by client, the affiliation value must be configured in CA
  const secret = await caClient.register(
    {
      affiliation: 'org1.department1',
      enrollmentID: newUserId,
      attrs: userAttributes,
      role,
    },
    adminUser
  );
  const enrollment = await caClient.enroll({
    enrollmentID: newUserId,
    enrollmentSecret: secret,
  });
  const x509Identity = {
    credentials: {
      certificate: enrollment.certificate,
      privateKey: enrollment.key.toBytes(),
    },
    mspId: orgMspId,
    type: 'X.509',
  };
  await wallet.put(newUserId, x509Identity);
};

const createUserIdentity = async (
  email: string,
  type: string,
  role: string,
  req: Request
) => {
  const org = type;

  // build an in memory object with the network configuration (also known as a connection profile)
  const ccp = buildCCPOrg(org);

  // build an instance of the fabric ca services client based on
  // the information in the network configuration
  const caClient = buildCAClient(ccp, `ca.${org}.${process.env.DOMAIN}`);

  const attrs: IKeyValueAttribute[] = [
    {
      name: 'email',
      value: email,
      ecert: true,
    },
    {
      name: 'role',
      value: role,
      ecert: true,
    },
  ];

  const netRole = role === 'admin' ? role : 'client';

  const adminUserId = 'admin';

  await registerAndEnrollUser(
    caClient,
    org,
    adminUserId,
    email,
    netRole,
    attrs,
    type
  );
};

const getUserWallet = async (userId: string, orgType: string) => {
  const wallet = await buildWallet(orgType);

  const userWallet = await wallet.get(userId);

  return userWallet;
};

export {
  buildCAClient,
  enrollAdmin,
  registerAndEnrollUser,
  createUserIdentity,
  getUserWallet,
};
