#!/bin/bash

NOW=`date +"%Y%m%d"`
TIME=`date +"%H%M%S"`

ARTIFACT_PATH="./release-artifacts"
ARTIFACT_FILENAME="${ARTIFACT_PATH}/LIGitHubPR-${NOW}-${TIME}"
FILES_TO_EXPORT="./README.md ./LICENSE ./manifest.json ./LIGitHubPR.js ./icons/*"

# Creating artifact
zip ${ARTIFACT_FILENAME}.zip ${FILES_TO_EXPORT}

# Signing artifact
MD5=`md5sum ${ARTIFACT_FILENAME}.zip | awk '{ print $1 }'`
echo ${MD5} >> ${ARTIFACT_FILENAME}.checksum

#  Done
echo "Generated release artifact in « ./release-artifacts/LIGitHubPR-${NOW}-${TIME}.zip »"
