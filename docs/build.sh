#!/bin/bash
#
# Build Zola on Netlify
#

ZOLA_BIN=$(binrc install getzola/zola)
"$ZOLA_BIN" build $@
