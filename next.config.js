/** @type {import('next').NextConfig} */

const nextConfig = {
	experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['bcrypt']
  },
  output: 'standalone'
}

module.exports = nextConfig
