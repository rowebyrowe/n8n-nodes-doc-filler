module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: false,
  // coverageDirectory: 'coverage',
  // coverageReporters: ['text', 'lcov'],
  testMatch: ['**/?(*.)+(test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  roots: ['<rootDir>/nodes'],
};
