#!/bin/bash

source scripts/utils.sh

CHANNEL_NAME=${1}
CC_NAME=${2}
CC_SRC_PATH=${3}
CC_SRC_LANGUAGE=${4}
CC_VERSION=${5}
CC_SEQUENCE=${6}
CC_INIT_FCN="InitLedger"
CC_END_POLICY=${8}
CC_COLL_CONFIG=${9}
DELAY=${10}
MAX_RETRY=${11}
VERBOSE=${12:-"false"}

println "executing with the following"
println "- CHANNEL_NAME: ${C_GREEN}${CHANNEL_NAME}${C_RESET}"
println "- CC_NAME: ${C_GREEN}${CC_NAME}${C_RESET}"
println "- CC_SRC_PATH: ${C_GREEN}${CC_SRC_PATH}${C_RESET}"
println "- CC_SRC_LANGUAGE: ${C_GREEN}${CC_SRC_LANGUAGE}${C_RESET}"
println "- CC_VERSION: ${C_GREEN}${CC_VERSION}${C_RESET}"
println "- CC_SEQUENCE: ${C_GREEN}${CC_SEQUENCE}${C_RESET}"
println "- CC_END_POLICY: ${C_GREEN}${CC_END_POLICY}${C_RESET}"
println "- CC_COLL_CONFIG: ${C_GREEN}${CC_COLL_CONFIG}${C_RESET}"
println "- CC_INIT_FCN: ${C_GREEN}${CC_INIT_FCN}${C_RESET}"
println "- DELAY: ${C_GREEN}${DELAY}${C_RESET}"
println "- MAX_RETRY: ${C_GREEN}${MAX_RETRY}${C_RESET}"
println "- VERBOSE: ${C_GREEN}${VERBOSE}${C_RESET}"

FABRIC_CFG_PATH=$PWD/../config/

#User has not provided a name
if [ -z "$CC_NAME" ] || [ "$CC_NAME" = "NA" ]; then
    fatalln "No chaincode name was provided. Valid call example: ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go"

# User has not provided a path
elif [ -z "$CC_SRC_PATH" ] || [ "$CC_SRC_PATH" = "NA" ]; then
    fatalln "No chaincode path was provided. Valid call example: ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go"

# User has not provided a language
elif [ -z "$CC_SRC_LANGUAGE" ] || [ "$CC_SRC_LANGUAGE" = "NA" ]; then
    fatalln "No chaincode language was provided. Valid call example: ./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-go -ccl go"

## Make sure that the path to the chaincode exists
elif [ ! -d "$CC_SRC_PATH" ] && [ ! -f "$CC_SRC_PATH" ]; then
    fatalln "Path to chaincode does not exist. Please provide different path."
fi

CC_SRC_LANGUAGE=$(echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:])

# do some language specific preparation to the chaincode before packaging
if [ "$CC_SRC_LANGUAGE" = "javascript" ]; then
    CC_RUNTIME_LANGUAGE=node

elif [ "$CC_SRC_LANGUAGE" = "typescript" ]; then
    CC_RUNTIME_LANGUAGE=node

    infoln "Compiling TypeScript code into JavaScript..."
    pushd $CC_SRC_PATH
    npm install
    npm run build
    popd
    successln "Finished compiling TypeScript code into JavaScript"

else
    fatalln "The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script. Supported chaincode languages are: go, java, javascript, and typescript"
    exit 1
fi

INIT_REQUIRED="--init-required"

if [ "$CC_END_POLICY" = "NA" ]; then
    CC_END_POLICY=""
else
    CC_END_POLICY="--signature-policy $CC_END_POLICY"
fi

if [ "$CC_COLL_CONFIG" = "NA" ]; then
    CC_COLL_CONFIG=""
else
    CC_COLL_CONFIG="--collections-config $CC_COLL_CONFIG"
fi

# import utils
. scripts/envVar.sh
. scripts/ccutils.sh

packageChaincode() {
    set -x
    peer lifecycle chaincode package ${CC_NAME}.tar.gz --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} --label ${CC_NAME}_${CC_VERSION} >&log.txt
    res=$?
    PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)
    { set +x; } 2>/dev/null
    cat log.txt
    verifyResult $res "Chaincode packaging has failed"
    successln "Chaincode is packaged"
}

## package the chaincode
packageChaincode

## Install chaincode on the peers of the organizations
infoln "Installing chaincode on peer0.supplier..."
installChaincode "supplier"
infoln "Install chaincode on peer0.manufacturer..."
installChaincode "manufacturer"
infoln "Install chaincode on peer0.wholesaler..."
installChaincode "distributor"
infoln "Install chaincode on peer0.distributor..."
installChaincode "wholesaler"
infoln "Install chaincode on peer0.retailer..."
installChaincode "retailer"
infoln "Install chaincode on peer0.consumer..."
installChaincode "consumer"

## query whether the chaincode is installed
queryInstalled "supplier"

## approve the definition for supplier
approveForMyOrg "supplier"

## now approve for manufacturer
approveForMyOrg "manufacturer"

## now approve for distributor
approveForMyOrg "distributor"

## now approve for wholesaler
approveForMyOrg "wholesaler"

## now approve for retailer
approveForMyOrg "retailer"

## now approve for consumer
approveForMyOrg "consumer"

## check whether the chaincode definition is ready to be committed
## expect them all to have approved
checkCommitReadiness "supplier" "\"supplierMSP\": true" "\"manufacturerMSP\": true" "\"distributorMSP\": true" "\"wholesalerMSP\": true" "\"retailerMSP\": true" "\"consumerMSP\": true"
checkCommitReadiness "manufacturer" "\"supplierMSP\": true" "\"manufacturerMSP\": true" "\"distributorMSP\": true" "\"wholesalerMSP\": true" "\"retailerMSP\": true" "\"consumerMSP\": true"
checkCommitReadiness "distributor" "\"supplierMSP\": true" "\"manufacturerMSP\": true" "\"distributorMSP\": true" "\"wholesalerMSP\": true" "\"retailerMSP\": true" "\"consumerMSP\": true"
checkCommitReadiness "wholesaler" "\"supplierMSP\": true" "\"manufacturerMSP\": true" "\"distributorMSP\": true" "\"wholesalerMSP\": true" "\"retailerMSP\": true" "\"consumerMSP\": true"
checkCommitReadiness "retailer" "\"supplierMSP\": true" "\"manufacturerMSP\": true" "\"distributorMSP\": true" "\"wholesalerMSP\": true" "\"retailerMSP\": true" "\"consumerMSP\": true"
checkCommitReadiness "consumer" "\"supplierMSP\": true" "\"manufacturerMSP\": true" "\"distributorMSP\": true" "\"wholesalerMSP\": true" "\"retailerMSP\": true" "\"consumerMSP\": true"

## now that we know for sure both orgs have approved, commit the definition
commitChaincodeDefinition "supplier" "manufacturer" "distributor" "wholesaler" "retailer" "consumer"

## query on the orgs to see that the definition committed successfully
queryCommitted "supplier"
queryCommitted "manufacturer"
queryCommitted "distributor"
queryCommitted "wholesaler"
queryCommitted "retailer"
queryCommitted "consumer"

## Invoke the chaincode - this does require that the chaincode have the 'initLedger'
## method defined
if [ "$CC_INIT_FCN" = "NA" ]; then
    infoln "Chaincode initialization is not required"
else
    chaincodeInvokeInit "supplier" "manufacturer" "distributor" "wholesaler" "retailer" "consumer"
fi

exit 0
