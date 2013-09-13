#!/bin/sh

uglifyjs dodos.js --screw-ie8 --mangle --compress --output=dodos.min.js
cssc style.css > style.min.css

rm /tmp/dodos.zip
zip /tmp/dodos.zip index.html dodos.min.js style.min.css coin.ogg dodo.ogg
ls -l /tmp/dodos.zip


