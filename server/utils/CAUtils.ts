import FabricCAServices from 'fabric-ca-client';
import { Wallet } from 'fabric-network';

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

export { buildCAClient, enrollAdmin };
