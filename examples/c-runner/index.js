const path = require('path');
const os = require('os');
const mooshakDaFeira = require('../../src/index');

const getTest = (id) => ({
  input: path.resolve(__dirname, 'tests', `test${id}.in`),
  output: path.resolve(__dirname, 'tests', `test${id}.out`),
});

mooshakDaFeira({
  workingDirectory: os.tmpdir(),
  profiles: {
    c: {
      file: 'main.c', // file name
      preRunCommands: [
        // compilation, etc
        'gcc main.c -o main',
      ],
      command: './main', // the command which will be given stdin
      timeout: 1000,
    },
  },
  tests: [
    {
      profile: 'c',
      tags: ['public test'],
      description: "Sends 'foo' on stdin and expects 'bar' to be printed.",
      ...getTest('01'),
    },
    {
      profile: 'c',
      tags: ['public test'],
      description: "Sends 'hello' on stdin and expects 'world' to be printed.",
      ...getTest('02'),
    },
  ],
  port: 5000,
});
