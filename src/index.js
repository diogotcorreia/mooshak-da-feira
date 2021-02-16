const path = require('path');
const spawn = require('child_process').spawn;
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuid } = require('uuid');
const { enqueue, unqueue, getQueueSize } = require('./queue');
const { startContainer } = require('./docker');
const fs = require('fs').promises;
const Stream = require('stream');

const parseTests = (profiles, tests) =>
  tests.map((v) => ({ ...v, profile: profiles[v.profile] })).filter((v) => !!v.profile);

const mooshakDaFeira = ({ profiles = {}, tests = [], port = process.env.PORT || 5000 } = {}) => {
  const app = express();
  const server = http.createServer(app);
  const io = socketIo(server);

  app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  app.use(express.static(path.join(__dirname, 'static')));

  const parsedTests = parseTests(profiles, tests);

  io.on('connection', handleSocket(parsedTests));

  server.listen(port);
  console.log(`Listening on port ${port}.`);
};

const handleSocket = (tests) => (socket) => {
  socket.on('submit', (code) => {
    socket.emit('clear');
    runTests(tests, socket, code);
  });
};

const runTests = (tests, socket, code) => {
  const start = async () => {
    const writableStream = new Stream.Writable();
    writableStream._write = (chunk, encoding, next) => {
      socket.emit('result', chunk.toString());
      next();
    };
    writableStream.on('close', () => socket.emit('done'));
    // Use a standard for loop to run one test at a time
    for (test of tests) await runTest(test, code, writableStream);
  };

  enqueue(socket.id, start);
};

const runTest = async (test, code, writeBack) => {
  test = { ...test, stdin: `${test.stdin.replace('%mooshak_da_feira_code%', code)}\n` };
  return await startContainer(test, writeBack);
};

module.exports = mooshakDaFeira;
