#!/bin/bash
# Script to add vendors to the system

echo "Starting vendor creation process..."
node -e "require('./server/createVendorsDirectly').createVendorsDirectly()"