# SDK

SDK for $(echo $sdk | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++){$i=toupper(substr($i,1,1)) substr($i,2)}}1').

## Status

✅ Production-ready

## Installation

\`\`\`bash
npm install @jellychain/sushiswap-sdk
\`\`\`
