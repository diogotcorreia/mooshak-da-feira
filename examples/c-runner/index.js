const fs = require('fs');
const path = require('path');
const os = require('os');
const mooshakDaFeira = require('../../src/index');

const getTest = (id) => ({
  input: fs.readFileSync(path.resolve(__dirname, 'tests', `test${id}.in`), 'utf-8'),
  output: fs.readFileSync(path.resolve(__dirname, 'tests', `test${id}.out`), 'utf-8'),
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
      ignoreNewlinesOnCompare: false, // whether to replace newlines with nothing in the output before comparing it to the expected output
      preRunHook: ({ test, workingDirectory }) => {}, // runs before preRunCommands
    },
  },
  tests: [
    {
      profile: 'c',
      tags: ['public test'],
      description: "Sends 'foo' on stdin and expects 'bar' to be printed.",
      ignoreNewlinesOnCompare: true, // overwrite the default profile value
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
