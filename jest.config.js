/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  // El volumen donde vive el proyecto genera archivos AppleDouble (._*.ts) que
  // matchean el glob de arriba; se excluyen explicitamente.
  testPathIgnorePatterns: ['/node_modules/', '/\\._'],
  clearMocks: true,
};
