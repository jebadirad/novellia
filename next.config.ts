import type { NextConfig } from 'next';
const config: NextConfig = {
  turbopack: { root: process.cwd() },
  outputFileTracingExcludes: {
    '/*': [
      './node_modules/geo-tz/data/timezones-now.*',
      './node_modules/geo-tz/data/timezones.geojson.*',
    ],
  },
  serverExternalPackages: ['geo-tz'],
  outputFileTracingIncludes: {
    '/api/providers/**': ['./node_modules/geo-tz/data/timezones-1970.*'],
  },
};
export default config;
