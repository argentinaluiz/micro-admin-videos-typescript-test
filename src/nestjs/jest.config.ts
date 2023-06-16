export default {
  displayName: {
    name: 'nestjs',
    color: 'magentaBright',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\..*spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': '@swc/jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageProvider: "v8",
  coverageDirectory: '../__coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@fc/micro\\-videos/(.*)$':
      '<rootDir>/../../../node_modules/@fc/micro-videos/dist/$1',
    //'#seedwork/domain': '<rootDir>/../../../node_modules/@fc/micro-videos/dist/@seedwork/domain/index.js',
    //TODO - vamos ver depois
    '#seedwork/(.*)$':
       '<rootDir>/../../../node_modules/@fc/micro-videos/dist/@seedwork/$1',
    //'#category/domain': '<rootDir>/../../../node_modules/@fc/micro-videos/dist/category/domain/index.js',
    //vamos ver mais tarde se é necessário
    //TODO - vamos ver depois
     '#category/(.*)$':
       '<rootDir>/../../../node_modules/@fc/micro-videos/dist/category/$1',
      '#cast-member/(.*)$':
       '<rootDir>/../../../node_modules/@fc/micro-videos/dist/cast-member/$1',
       '#genre/(.*)$':
       '<rootDir>/../../../node_modules/@fc/micro-videos/dist/genre/$1',
  },
  setupFilesAfterEnv: ['../../@core/src/@seedwork/domain/tests/jest.ts'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    },
  },
};
