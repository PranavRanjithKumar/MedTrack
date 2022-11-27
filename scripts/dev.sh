#!/bin/bash

pushd "./dev/"
npm install
node gen-node-file.js >medtrack_network_node.json
popd
