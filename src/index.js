const path = require('path');
const os = require('os');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { enqueue, unqueue, getQueueSize } = require('./queue');
const { generateFolder, deleteFolder, saveFile } = require('./filesystem');
const { exec } = require('child_process');
const util = require('util');

const parseTests = (profiles, tests) =>
  tests.map((v) => ({ ...v, profile: profiles[v.profile] })).filter((v) => !!v.profile);

const mooshakDaFeira = ({
  workingDirectory = os.tmpdir(),
  profiles = {},
  tests = [],
  port = process.env.PORT || 5000,
} = {}) => {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);

  app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.use(express.static(path.join(__dirname, 'static')));

  const parsedTests = parseTests(profiles, tests);

  io.on('connection', handleSocket({ workingDirectory, tests: parsedTests }));

  server.listen(port);
  console.log(`Listening on port ${port}.`);
};

const handleSocket = (config) => (socket) => {
  socket.on('submit', (code) => {
    socket.emit('clear');
    runTests(config, socket, code);
  });
  socket.on('tests', () => {
    socket.emit(
      'tests',
      config.tests.map((test) => ({ tags: test.tags, description: test.description }))
    );
  });
  socket.on('leaveQueue', () => unqueue(socket.id));
};

const runTests = (config, socket, code) => {
  const start = async () => {
    socket.emit('start');

    const workingDirectory = await generateFolder(config.workingDirectory);

    // Use a standard for loop to run one test at a time
    for (let i = 0; i < config.tests.length; ++i)
      await runTest(i, config.tests[i], code, socket, workingDirectory);

    await deleteFolder(workingDirectory);
    socket.emit('done');
  };

  socket.emit('queueSize', getQueueSize());
  enqueue(socket.id, start);
};

const runTest = async (i, test, code, socket, workingDirectory) => {
  try {
    await saveFile(workingDirectory, test.profile.file, code);

    try {
      for (cmd of test.profile.preRunCommands)
        await util.promisify(exec)(cmd, {
          cwd: workingDirectory,
          timeout: 1000,
          windowsHide: true,
        });
    } catch (e) {
      socket.emit('result', { test: i, status: 'COMPILE_ERROR', ...e });
      return;
    }

    await new Promise((resolve) => {
      const cmdProcess = exec(
        test.profile.command,
        {
          cwd: workingDirectory,
          timeout: test.profile.timeout,
          windowsHide: true,
        },
        (err, stdout, stderr) => {
          if (err) {
            socket.emit('result', {
              test: i,
              status: err.killed ? 'TIME_LIMIT_EXCEEDED' : 'RUNTIME_ERROR',
              ...err,
            });
            resolve();
            return;
          }
          const shouldTrim = test.trimOutputOnCompare ?? test.profile.trimOutputOnCompare;
          if (shouldTrim) stdout = stdout.trim();
          socket.emit('result', {
            test: i,
            status: stdout == test.output ? 'SUCCESS' : 'WRONG_ANSWER',
            stdout,
            stderr,
          });
          resolve();
        }
      );

      if (test.input) cmdProcess.stdin.write(test.input, console.error);
      cmdProcess.stdin.end(console.error);
    });
  } catch (e) {
    console.error(e);
    socket.emit('result', { test: i, status: 'GRADER_EXCEPTION' });
  }
};

module.exports = mooshakDaFeira;
