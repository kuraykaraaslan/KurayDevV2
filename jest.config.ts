import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: ['services/**/*.ts', 'helpers/**/*.ts', 'utils/**/*.ts'],
}

export default config
