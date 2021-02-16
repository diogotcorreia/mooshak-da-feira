const fs = require('fs');
const path = require('path');

const graderCode = fs.readFileSync(path.join(__dirname, 'grader.py'), 'utf-8');

const mooshakDaFeira = require('../../src/index');

mooshakDaFeira({
  profiles: {
    python: {
      image: 'python:3.9.1-alpine3.13',
      network: false,
      limits: {
        time: 1, // In seconds
        memory: 64, // in MiB
      },
    },
  },
  tests: [
    {
      profile: 'python',
      exec: 'python3 test.py',
      files: {
        'test.py': graderCode,
        'code.py': '%mooshak_da_feira_code%', // %mooshak_da_feira_code% will be replaced with the input from the user
      },
      stdin: '', // you can pass %mooshak_da_feira_code% here as well
    },
  ],
  port: 5000,
});
