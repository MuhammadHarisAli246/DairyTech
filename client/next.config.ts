import type { NextConfig } from "next";
import os from "os";

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const nextConfig: NextConfig = {
  async rewrites() {
    const host = process.env.BACKEND_HOST || getLocalIP();
    const port = process.env.BACKEND_PORT || "5000";
    return [
      {
        source: "/api/:path*",
        destination: `http://${host}:${port}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
