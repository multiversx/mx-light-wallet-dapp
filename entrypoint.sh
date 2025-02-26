#!/bin/sh

# List of environment variables and their default values
env_vars_with_defaults="START_NETWORK_ID_STOP=sovereign START_NETWORK_NAME_STOP=Sovereign START_API_ADDRESS_STOP=https://api-sovereign-test.elrond.ro START_GATEWAY_URL_STOP= START_EXTRAS_API_URL_STOP=https://extras-api-sovereign-test.elrond.ro START_SAMPLE_AUTHENTICATED_DOMAINS_STOP=https://api-sovereign-test.elrond.ro START_SOVEREIGN_CONTRACT_ADDR_STOP=erd1qqqqqqqqqqqqqpgqkh3lkj9dznw7awmulw2xcfzkael83jaflrhswsar06 START_WALLET_ADDRESS_STOP=https://wallet-sovereign-test.elrond.ro START_WEGLD_ID_STOP=WEGLD-bd4d79 START2_NETWORK_ID_STOP2=Testnet START2_NETWORK_NAME_STOP2=Testnet START2_API_ADDRESS_STOP2=https://testnet-api.multiversx.com START2_GATEWAY_URL_STOP2= START2_EXTRAS_API_URL_STOP2=https://testnet-extras-api.multiversx.com START2_SAMPLE_AUTHENTICATED_DOMAINS_STOP2=https://testnet-api.multiversx.com START2_SOVEREIGN_CONTRACT_ADDR_STOP2=erd1qqqqqqqqqqqqqpgqkhqeu7e2t62pwuadcshlrmxcharcstkhlrhs8cg509 START2_WALLET_ADDRESS_STOP2=https://testnet-wallet.multiversx.com START2_WEGLD_ID_STOP2="

replace_placeholder() {
  local var_name=$1
  local var_value=$2

  echo "Var ${var_name} defined, replacing ${var_value} in config"
  find /usr/share/nginx/html/ -type f -exec sed -i 's|'${var_name}'|'${var_value}'|g' {} +
}

# Loop through each environment variable
for entry in $env_vars_with_defaults; do
  # Split the entry into name and value
  var_name=$(echo $entry | cut -d= -f1)
  default_value=$(echo $entry | cut -d= -f2)

  # Use the environment variable value if defined; otherwise, use the default
  eval "value=\${$var_name:-$default_value}"

  # Execute the function with the variable name and value
  replace_placeholder "$var_name" "$value"
done

# FIX NGINX 
sed -i '/location \/ {/,/}/d' /etc/nginx/conf.d/default.conf
sed -i '/#access_log/a\
location /assets/ {\
    root   /usr/share/nginx/html;\
    index  index.html index.htm;\
}\
\
location / {\
    rewrite ^ /index.html break;\
    root   /usr/share/nginx/html;\
    index  index.html index.htm;\
}' /etc/nginx/conf.d/default.conf
cat /etc/nginx/conf.d/default.conf


exec nginx -g 'daemon off;'
