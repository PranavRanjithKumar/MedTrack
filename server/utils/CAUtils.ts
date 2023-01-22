import FabricCAServices, { IKeyValueAttribute } from 'fabric-ca-client';
import { Wallet } from 'fabric-network';
import { IUser } from '../models/userModel';
import AppError from './AppError';

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
  orgMspId: string
): Promise<void> => {
  try {
    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get(process.env.FABRIC_CA_ADMIN as string);
    if (identity) {
      console.log(
        'An identity for the admin user already exists in the wallet'
      );
      return;
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await caClient.enroll({
      enrollmentID: process.env.FABRIC_CA_ADMIN as string,
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
    await wallet.put(process.env.FABRIC_CA_ADMIN as string, x509Identity);
    console.log(
      'Successfully enrolled admin user and imported it into the wallet'
    );
  } catch (error) {
    console.error(`Failed to enroll admin user : ${error}`);
  }
};

const registerAndEnrollUser = async (
  caClient: FabricCAServices,
  wallet: Wallet,
  orgMspId: string,
  role: string,
  adminUserId: string,
  userAttributes: IKeyValueAttribute[],
  newUser: IUser,
  affiliation: string
): Promise<void> => {
  // Check to see if we've already enrolled the user
  const userIdentity = await wallet.get(newUser.email);
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

  // Register the user, enroll the user, and import the new identity into the wallet.
  // if affiliation is specified by client, the affiliation value must be configured in CA
  const secret = await caClient.register(
    {
      affiliation,
      enrollmentID: newUser.email,
      attrs: userAttributes,
      role,
    },
    adminUser
  );
  const enrollment = await caClient.enroll({
    enrollmentID: newUser.email,
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
  await wallet.put(newUser.email, x509Identity);
};

export { buildCAClient, enrollAdmin, registerAndEnrollUser };
