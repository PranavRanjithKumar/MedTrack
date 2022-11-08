#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

# imports
. scripts/utils.sh

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/medtrack.com/tlsca/tlsca.medtrack.com-cert.pem
export PEER0_supplier_CA=${PWD}/organizations/peerOrganizations/supplier.medtrack.com/tlsca/tlsca.supplier.medtrack.com-cert.pem
export PEER0_manufacturer_CA=${PWD}/organizations/peerOrganizations/manufacturer.medtrack.com/tlsca/tlsca.manufacturer.medtrack.com-cert.pem
export PEER0_distributor_CA=${PWD}/organizations/peerOrganizations/distributor.medtrack.com/tlsca/tlsca.distributor.medtrack.com-cert.pem
export PEER0_wholesaler_CA=${PWD}/organizations/peerOrganizations/wholesaler.medtrack.com/tlsca/tlsca.wholesaler.medtrack.com-cert.pem
export PEER0_retailer_CA=${PWD}/organizations/peerOrganizations/retailer.medtrack.com/tlsca/tlsca.retailer.medtrack.com-cert.pem
export PEER0_consumer_CA=${PWD}/organizations/peerOrganizations/consumer.medtrack.com/tlsca/tlsca.consumer.medtrack.com-cert.pem

export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/medtrack.com/orderers/orderer.medtrack.com/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/medtrack.com/orderers/orderer.medtrack.com/tls/server.key

# Set environment variables for the peer org
setGlobals() {
    local USING_ORG=""
    if [ -z "$OVERRIDE_ORG" ]; then
        USING_ORG=$1
    else
        USING_ORG="${OVERRIDE_ORG}"
    fi
    infoln "Using ${USING_ORG} organization"
    if [ $USING_ORG == "supplier" ]; then
        export CORE_PEER_LOCALMSPID="supplierMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_supplier_CA
        export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/supplier.medtrack.com/users/Admin@supplier.medtrack.com/msp
        export CORE_PEER_ADDRESS=localhost:7051
    elif [ $USING_ORG == "manufacturer" ]; then
        export CORE_PEER_LOCALMSPID="manufacturerMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_manufacturer_CA
        export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/manufacturer.medtrack.com/users/Admin@manufacturer.medtrack.com/msp
        export CORE_PEER_ADDRESS=localhost:7071
    elif [ $USING_ORG == "distributor" ]; then
        export CORE_PEER_LOCALMSPID="distributorMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_distributor_CA
        export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/distributor.medtrack.com/users/Admin@distributor.medtrack.com/msp
        export CORE_PEER_ADDRESS=localhost:7092
    elif [ $USING_ORG == "wholesaler" ]; then
        export CORE_PEER_LOCALMSPID="wholesalerMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_wholesaler_CA
        export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/wholesaler.medtrack.com/users/Admin@wholesaler.medtrack.com/msp
        export CORE_PEER_ADDRESS=localhost:8021
    elif [ $USING_ORG == "retailer" ]; then
        export CORE_PEER_LOCALMSPID="retailerMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_retailer_CA
        export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/retailer.medtrack.com/users/Admin@retailer.medtrack.com/msp
        export CORE_PEER_ADDRESS=localhost:8051
    elif [ $USING_ORG == "consumer" ]; then
        export CORE_PEER_LOCALMSPID="consumerMSP"
        export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_consumer_CA
        export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/consumer.medtrack.com/users/Admin@consumer.medtrack.com/msp
        export CORE_PEER_ADDRESS=localhost:8091
    else
        errorln "ORG Unknown"
    fi

    if [ "$VERBOSE" == "true" ]; then
        env | grep CORE
    fi
}

# Set environment variables for use in the CLI container
setGlobalsCLI() {
    setGlobals $1

    local USING_ORG=""
    if [ -z "$OVERRIDE_ORG" ]; then
        USING_ORG=$1
    else
        USING_ORG="${OVERRIDE_ORG}"
    fi
    if [ $USING_ORG == "supplier" ]; then
        export CORE_PEER_ADDRESS=peer0.supplier.medtrack.com:7051
    elif [ $USING_ORG == "manufacturer" ]; then
        export CORE_PEER_ADDRESS=peer0.manufacturer.medtrack.com:7071
    elif [ $USING_ORG == "distributor" ]; then
        export CORE_PEER_ADDRESS=peer0.distributor.medtrack.com:7092
    elif [ $USING_ORG == "wholesaler" ]; then
        export CORE_PEER_ADDRESS=peer0.wholesaler.medtrack.com:8021
    elif [ $USING_ORG == "retailer" ]; then
        export CORE_PEER_ADDRESS=peer0.retailer.medtrack.com:8051
    elif [ $USING_ORG == "consumer" ]; then
        export CORE_PEER_ADDRESS=peer0.consumer.medtrack.com:8091
    else
        errorln "ORG Unknown"
    fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {
    PEER_CONN_PARMS=()
    PEERS=""
    while [ "$#" -gt 0 ]; do
        setGlobals $1
        PEER="peer0.$1"
        ## Set peer addresses
        if [ -z "$PEERS" ]; then
            PEERS="$PEER"
        else
            PEERS="$PEERS $PEER"
        fi
        PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" --peerAddresses $CORE_PEER_ADDRESS)
        ## Set path to TLS certificate
        CA=PEER0_$1_CA
        TLSINFO=(--tlsRootCertFiles "${!CA}")
        PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" "${TLSINFO[@]}")
        # shift by one to get to the next organization
        shift
    done
}

verifyResult() {
    if [ $1 -ne 0 ]; then
        fatalln "$2"
    fi
}
