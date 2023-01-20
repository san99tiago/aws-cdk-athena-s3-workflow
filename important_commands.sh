#!/bin/bash

################################################################################
# PART 1: Configure NodeJs and CDK libraries
################################################################################

# Install NodeJs
# -->  https://nodejs.org/en/download/

# Verify that NodeJs/npm is installed correctly
node --version
npm --version

# Install AWS-CDK (on NodeJs)
sudo npm install -g aws-cdk

# Verify correct install of AWS-CDK
npm list --global | grep aws-cdk


################################################################################
# PART 2: Initial Project Setup (Only run these at the beginning)
################################################################################

# Configure AWS credentials (follow steps)
aws configure

# Bootstrap CDK (provision initial resources to work with CDK.. S3, roles, etc)
#! Change "ACCOUNT-NUMBER" and "REGION" to your needed values 
cdk bootstrap aws://ACCOUNT-NUMBER/REGION

# Create the CDK project's folder
mkdir cdk
cd cdk || echo "Make sure that the folder exists"

# Initialize project
cdk init --language typescript

# Note: add necessary CDK npm libraries:
npm install dependency_name  # Change "dependency_name" to the actual library


################################################################################
# PART 3: Main CDK commands (most used)
################################################################################

# Validate that CDK is correclty initialized on target account
cdk bootstrap

# TODO: Add tests here


# Relevant CDK commands for Stacks management
cdk synthesize
cdk diff
cdk deploy
cdk destroy


################################################################################
# PART 4: Other CDK usefull commands
################################################################################

# Help
cdk --help
cdk deploy --help

# Lists the stacks in the app
cdk list

# Synthesizes and prints the CloudFormation template for the specified stack(s)
cdk synthesize

# Deploys the CDK Toolkit staging stack (necessary resources in AWS account)
cdk bootstrap

# Deploys the specified stack(s)
cdk deploy

# Destroys the specified stack(s)
cdk destroy

# Compares the specified stack with the deployed stack or a local CloudFormation template
cdk diff

# Displays metadata about the specified stack
cdk metadata

# Creates a new CDK project in the current directory from a specified template
cdk init

# Manages cached context values
cdk context

# Opens the CDK API reference in your browser
cdk docs

# Checks your CDK project for potential problems
cdk doctor
