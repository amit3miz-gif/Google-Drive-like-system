# Get the interface used for the default route (internet)
$defaultIfIndex = (Get-NetRoute -DestinationPrefix "0.0.0.0/0" `
  | Sort-Object -Property RouteMetric `
  | Select-Object -First 1 -ExpandProperty IfIndex)

# Get the IPv4 address on that interface
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $defaultIfIndex `
  | Where-Object { $_.IPAddress -match '^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.' } `
  | Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $ip) {
  throw "Could not detect LAN IPv4 address from default route interface"
}

# Export environment variables for docker-compose
$env:EXPO_PUBLIC_API_URL = "http://${ip}:3000"
$env:LAN_IP = $ip

# Run mobile service
docker compose up --build mobile
