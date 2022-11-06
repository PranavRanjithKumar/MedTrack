#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

export PATH=${PWD}/bin:$PATH
export VERBOSE=false

. scripts/utils.sh

: ${CONTAINER_CLI:="docker"}
: ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI}-compose"}
infoln "Using ${CONTAINER_CLI} and ${CONTAINER_CLI_COMPOSE}"

# Obtain CONTAINER_IDS and remove them
# This function is called when you bring a network down
function clearContainers() {
    infoln "Removing remaining containers"
    ${CONTAINER_CLI} rm -f $(${CONTAINER_CLI} ps -aq --filter label=service=hyperledger-fabric) 2>/dev/null || true
    ${CONTAINER_CLI} rm -f $(${CONTAINER_CLI} ps -aq --filter name='dev-peer*') 2>/dev/null || true
}

# Delete any images that were generated as a part of this setup
# specifically the following images are often left behind:
# This function is called when you bring the network down
function removeUnwantedImages() {
    infoln "Removing generated chaincode docker images"
    ${CONTAINER_CLI} image rm -f $(${CONTAINER_CLI} images -aq --filter reference='dev-peer*') 2>/dev/null || true
}

# Versions of fabric known not to work with the medtrack application
NONWORKING_VERSIONS="^1\.0\. ^1\.1\. ^1\.2\. ^1\.3\. ^1\.4\."

# Do some basic sanity checking to make sure that the appropriate versions of fabric
# binaries/images are available. In the future, additional checking for the presence
# of go or other items could be added.
function checkPrereqs() {
    ## Check if your have cloned the peer binaries and configuration files.
    peer version >/dev/null 2>&1

    if [[ $? -ne 0 || ! -d "./config" ]]; then
        errorln "Peer binary and configuration files not found.."
        errorln
        errorln "Follow the instructions in the Fabric docs to install the Fabric Binaries:"
        errorln "https://hyperledger-fabric.readthedocs.io/en/latest/install.html"
        exit 1
    fi
    # use the fabric tools container to see if the samples and binaries match your
    # docker images
    LOCAL_VERSION=$(peer version | sed -ne 's/^ Version: //p')
    DOCKER_IMAGE_VERSION=$(${CONTAINER_CLI} run --rm hyperledger/fabric-tools:latest peer version | sed -ne 's/^ Version: //p')

    infoln "LOCAL_VERSION=$LOCAL_VERSION"
    infoln "DOCKER_IMAGE_VERSION=$DOCKER_IMAGE_VERSION"

    if [ "$LOCAL_VERSION" != "$DOCKER_IMAGE_VERSION" ]; then
        warnln "Local fabric binaries and docker images are out of  sync. This may cause problems."
    fi

    for UNSUPPORTED_VERSION in $NONWORKING_VERSIONS; do
        infoln "$LOCAL_VERSION" | grep -q $UNSUPPORTED_VERSION
        if [ $? -eq 0 ]; then
            fatalln "Local Fabric binary version of $LOCAL_VERSION does not match the versions supported by the test network."
        fi

        infoln "$DOCKER_IMAGE_VERSION" | grep -q $UNSUPPORTED_VERSION
        if [ $? -eq 0 ]; then
            fatalln "Fabric Docker image version of $DOCKER_IMAGE_VERSION does not match the versions supported by the test network."
        fi
    done

    fabric-ca-client version >/dev/null 2>&1
    if [[ $? -ne 0 ]]; then
        errorln "fabric-ca-client binary not found.."
        errorln
        errorln "Follow the instructions in the Fabric docs to install the Fabric Binaries:"
        errorln "https://hyperledger-fabric.readthedocs.io/en/latest/install.html"
        exit 1
    fi
    CA_LOCAL_VERSION=$(fabric-ca-client version | sed -ne 's/ Version: //p')
    CA_DOCKER_IMAGE_VERSION=$(docker run --rm hyperledger/fabric-ca:latest fabric-ca-client version | sed -ne 's/ Version: //p' | head -1)
    infoln "CA_LOCAL_VERSION=$CA_LOCAL_VERSION"
    infoln "CA_DOCKER_IMAGE_VERSION=$CA_DOCKER_IMAGE_VERSION"

    if [ "$CA_LOCAL_VERSION" != "$CA_DOCKER_IMAGE_VERSION" ]; then
        warnln "Local fabric-ca binaries and docker images are out of sync. This may cause problems."
    fi
}

# Before you can bring up a network, each organization needs to generate the crypto
# material that will define that organization on the network. Because Hyperledger
# Fabric is a permissioned blockchain, each node and user on the network needs to
# use certificates and keys to sign and verify its actions. In addition, each user
# needs to belong to an organization that is recognized as a member of the network.
# You can use the Cryptogen tool or Fabric CAs to generate the organization crypto
# material.

# By default, the sample network uses cryptogen. Cryptogen is a tool that is
# meant for development and testing that can quickly create the certificates and keys
# that can be consumed by a Fabric network. The cryptogen tool consumes a series
# of configuration files for each organization in the "organizations/cryptogen"
# directory. Cryptogen uses the files to generate the crypto  material for each
# org in the "organizations" directory.

# You can also use Fabric CAs to generate the crypto material. CAs sign the certificates
# and keys that they generate to create a valid root of trust for each organization.
# The script uses Docker Compose to bring up three CAs, one for each peer organization
# and the ordering organization. The configuration file for creating the Fabric CA
# servers are in the "organizations/fabric-ca" directory. Within the same directory,
# the "registerEnroll.sh" script uses the Fabric CA client to create the identities,
# certificates, and MSP folders that are needed to create the test network in the
# "organizations/ordererOrganizations" directory.

# Create Organization crypto material using cryptogen or CAs
function createOrgs() {
    if [ -d "organizations/peerOrganizations" ]; then
        rm -Rf organizations/peerOrganizations && rm -Rf organizations/ordererOrganizations
    fi

    # Create crypto material using Fabric CA
    infoln "Generating certificates using Fabric CA"
    ${CONTAINER_CLI_COMPOSE} -f compose/$COMPOSE_FILE_CA -f compose/$CONTAINER_CLI/${CONTAINER_CLI}-$COMPOSE_FILE_CA up -d 2>&1

    . organizations/fabric-ca/registerEnroll.sh

    while :; do
        if [ ! -f "organizations/fabric-ca/supplier/tls-cert.pem" ]; then
            sleep 1
        else
            break
        fi
    done

    infoln "Creating Supplier Organization Identities"

    createSupplierOrg

    infoln "Creating Manufacturer Organization Identities"

    createManufacturerOrg

    infoln "Creating Distributor Organization Identities"

    createDistributorOrg

    infoln "Creating Wholesaler Organization Identities"

    createWholesalerOrg

    infoln "Creating Retailer Organization Identities"

    createRetailerOrg

    infoln "Creating Consumer Organization Identities"

    createConsumerOrg

    infoln "Creating Orderer Org Identities"

    createOrderer

    infoln "Generating CCP files for all organizations"
    ./organizations/ccp-generate.sh
}

# Once you create the organization crypto material, you need to create the
# genesis block of the application channel.

# The configtxgen tool is used to create the genesis block. Configtxgen consumes a
# "configtx.yaml" file that contains the definitions for the sample network. The
# genesis block is defined using the "TwoOrgsApplicationGenesis" profile at the bottom
# of the file. This profile defines an application channel consisting of our two Peer Orgs.
# The peer and ordering organizations are defined in the "Profiles" section at the
# top of the file. As part of each organization profile, the file points to the
# location of the MSP directory for each member. This MSP is used to create the channel
# MSP that defines the root of trust for each organization. In essence, the channel
# MSP allows the nodes and users to be recognized as network members.
#
# If you receive the following warning, it can be safely ignored:
#
# [bccsp] GetDefault -> WARN 001 Before using BCCSP, please call InitFactories(). Falling back to bootBCCSP.
#
# You can ignore the logs regarding intermediate certs, we are not using them in
# this crypto implementation.

# After we create the org crypto material and the application channel genesis block,
# we can now bring up the peers and ordering service. By default, the base
# file for creating the network is "docker-compose-test-net.yaml" in the ``docker``
# folder. This file defines the environment variables and file mounts that
# point the crypto material and genesis block that were created in earlier.

# Bring up the peer and orderer nodes using docker compose.

function networkUp() {
    checkPrereqs

    # generate artifacts if they don't exist
    if [ ! -d "organizations/peerOrganizations" ]; then
        createOrgs
    fi

    COMPOSE_FILES="-f compose/${COMPOSE_FILE_BASE} -f compose/${CONTAINER_CLI}/${CONTAINER_CLI}-${COMPOSE_FILE_BASE}"

    if [ "${DATABASE}" == "couchdb" ]; then
        COMPOSE_FILES="${COMPOSE_FILES} -f compose/${COMPOSE_FILE_COUCH} -f compose/${CONTAINER_CLI}/${CONTAINER_CLI}-${COMPOSE_FILE_COUCH}"
    fi

    DOCKER_SOCK="${DOCKER_SOCK}" ${CONTAINER_CLI_COMPOSE} ${COMPOSE_FILES} up -d 2>&1

    $CONTAINER_CLI ps -a
    if [ $? -ne 0 ]; then
        fatalln "Unable to start network"
    fi
}

# call the script to create the channel, join the peers of org1 and org2,
# and then update the anchor peers for each organization
function createChannel() {
    # Bring up the network if it is not already up.
    bringUpNetwork="false"

    if ! $CONTAINER_CLI info >/dev/null 2>&1; then
        fatalln "$CONTAINER_CLI network is required to be running to create a channel"
    fi

    # check if all containers are present
    CONTAINERS=($($CONTAINER_CLI ps | grep hyperledger/ | awk '{print $2}'))
    len=$(echo ${#CONTAINERS[@]})

    if [[ $len -ge 4 ]] && [[ ! -d "organizations/peerOrganizations" ]]; then
        echo "Bringing network down to sync certs with containers"
        networkDown
    fi

    [[ $len -lt 4 ]] || [[ ! -d "organizations/peerOrganizations" ]] && bringUpNetwork="true" || echo "Network Running Already"

    if [ $bringUpNetwork == "true" ]; then
        infoln "Bringing up network"
        networkUp
    fi

    # now run the script that creates a channel. This script uses configtxgen once
    # to create the channel creation transaction and the anchor peer updates.
    scripts/createChannel.sh $CHANNEL_NAME $CLI_DELAY $MAX_RETRY $VERBOSE
}
