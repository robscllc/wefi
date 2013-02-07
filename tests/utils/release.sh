#!/bin/bash

VERSION=$1
TARGET=$2

[ -z $VERSION ] && exit 1
[ -z $TARGET ] && exit 1

BDIR=~/bundles
DDIR=~/deploy
CUR=$(git branch | grep \* | awk '{ print $2 }')

git checkout $VERSION || exit 1

TITLE=wefi-$VERSION
BUNDLE=$BDIR/$TITLE.tar.gz

rm -f $BUNDLE
mrt bundle $BUNDLE

pushd $DDIR 
tar zxpf $BUNDLE || exit 1
find bundle -type d -print0 | xargs -0 chmod o+rx
find bundle -type f -print0 | xargs -0 chmod o+r
rm -rf $TITLE/
mv bundle $TITLE || exit 1
rm -f $TARGET
ln -s $TITLE $TARGET
popd

git checkout $CUR

