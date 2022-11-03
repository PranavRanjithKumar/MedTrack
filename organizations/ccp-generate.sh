#!/bin/bash

function one_line_pem {
    echo "$(awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1)"
}

function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG=supplier
P0PORT=7051
CAPORT=7054
PEERPEM=organizations/peerOrganizations/supplier.medtrack.com/tlsca/tlsca.supplier.medtrack.com-cert.pem
CAPEM=organizations/peerOrganizations/supplier.medtrack.com/ca/ca.supplier.medtrack.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/supplier.medtrack.com/connection-supplier.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/supplier.medtrack.com/connection-supplier.yaml

ORG=manufacturer
P0PORT=7071
CAPORT=7073
PEERPEM=organizations/peerOrganizations/manufacturer.medtrack.com/tlsca/tlsca.manufacturer.medtrack.com-cert.pem
CAPEM=organizations/peerOrganizations/manufacturer.medtrack.com/ca/ca.manufacturer.medtrack.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/manufacturer.medtrack.com/connection-manufacturer.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/manufacturer.medtrack.com/connection-manufacturer.yaml

ORG=distributor
P0PORT=7092
CAPORT=7096
PEERPEM=organizations/peerOrganizations/distributor.medtrack.com/tlsca/tlsca.distributor.medtrack.com-cert.pem
CAPEM=organizations/peerOrganizations/distributor.medtrack.com/ca/ca.distributor.medtrack.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/distributor.medtrack.com/connection-distributor.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/distributor.medtrack.com/connection-distributor.yaml

ORG=wholesaler
P0PORT=8021
CAPORT=8023
PEERPEM=organizations/peerOrganizations/wholesaler.medtrack.com/tlsca/tlsca.wholesaler.medtrack.com-cert.pem
CAPEM=organizations/peerOrganizations/wholesaler.medtrack.com/ca/ca.wholesaler.medtrack.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/wholesaler.medtrack.com/connection-wholesaler.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/wholesaler.medtrack.com/connection-wholesaler.yaml

ORG=retailer
P0PORT=8051
CAPORT=8054
PEERPEM=organizations/peerOrganizations/retailer.medtrack.com/tlsca/tlsca.retailer.medtrack.com-cert.pem
CAPEM=organizations/peerOrganizations/retailer.medtrack.com/ca/ca.retailer.medtrack.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/retailer.medtrack.com/connection-retailer.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/retailer.medtrack.com/connection-retailer.yaml

ORG=consumer
P0PORT=8091
CAPORT=8096
PEERPEM=organizations/peerOrganizations/consumer.medtrack.com/tlsca/tlsca.consumer.medtrack.com-cert.pem
CAPEM=organizations/peerOrganizations/consumer.medtrack.com/ca/ca.consumer.medtrack.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/consumer.medtrack.com/connection-consumer.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" >organizations/peerOrganizations/consumer.medtrack.com/connection-consumer.yaml
