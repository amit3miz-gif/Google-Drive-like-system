#!/bin/bash

ENV_FILE=".env"

# IPv4 validation function
is_valid_ip() {
  local ip=$1
  local IFS=.
  local -a octets

  # Split IP into octets
  read -ra octets <<< "$ip"

  # Must have exactly 4 octets
  [ "${#octets[@]}" -eq 4 ] || return 1

  for octet in "${octets[@]}"; do
    # Each octet must be a number between 0 and 255
    [[ "$octet" =~ ^[0-9]+$ ]] || return 1
    (( octet >= 0 && octet <= 255 )) || return 1
  done

  return 0
}

# Ask user for LAN IP
read -p "Enter your LAN IP (e.g. 192.168.122.175): " LAN_IP

# Validate IP
if ! is_valid_ip "$LAN_IP"; then
  echo "Error: Invalid IPv4 address"
  exit 1
fi

# Create or overwrite .env
cat > "$ENV_FILE" <<EOF
# Mobile app API endpoint
EXPO_PUBLIC_API_URL=http://${LAN_IP}:3000

# LAN IP for Expo packager
LAN_IP=${LAN_IP}
EOF

echo "Starting mobile service..."
docker compose up --build mobile
