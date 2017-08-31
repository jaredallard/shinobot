#!/usr/bin/env sh
#
# (c) 2017 Jared Allard
#

echo "running as '$(whoami)'"
echo "running in '$(pwd)'"

# This allows us to use image built node_modules, no yarn needed!
echo "shadow mounting '/node_modules' -> $(pwd)/node_modules"
ln -sv /node_modules $(pwd)/node_modules

yarn global add shinojs nodemon

yarn start
