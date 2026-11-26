const { spawnSync } = require('child_process');
const path = require('path');

const backendDir = path.resolve(__dirname, '../..');

function readConfig(nodeEnv, localUri, productionUri) {
  return spawnSync(process.execPath, ['-e', "const env = require('./src/config/env'); console.log(JSON.stringify({ nodeEnv: env.NODE_ENV, dbUri: env.DB_URI }));"], {
    cwd: backendDir,
    env: {
      ...process.env,
      NODE_ENV: nodeEnv,
      DB_URI: localUri,
      DB_URI_PROD: productionUri,
      JWT_SECRET: 'test-secret-with-enough-length',
    },
    encoding: 'utf8',
  });
}

describe('database environment selection', () => {
  const localUri = 'mongodb://127.0.0.1:27017/local-test';
  const productionUri = 'mongodb://127.0.0.1:27017/production-test';

  it.each(['development', 'test'])('uses DB_URI in %s mode', (mode) => {
    const result = readConfig(mode, localUri, productionUri);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ nodeEnv: mode, dbUri: localUri });
  });

  it('uses DB_URI_PROD in production', () => {
    const result = readConfig('production', localUri, productionUri);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ nodeEnv: 'production', dbUri: productionUri });
  });

  it('fails instead of using the local URI when the production URI is missing', () => {
    const result = readConfig('production', localUri, '');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('DB_URI_PROD is required');
  });

  it('fails when the local URI is missing', () => {
    const result = readConfig('development', '', productionUri);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('DB_URI is required');
  });
});
