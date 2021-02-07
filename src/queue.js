let currentProcess = null;
let queue = [];

const enqueue = (id, callback) => {
  queue.push({ id, callback });
  if (!currentProcess) nextInQueue();
};

const nextInQueue = async () => {
  if (queue.length === 0) return;
  const element = queue.shift();
  currentProcess = element;
  await element.callback();
  currentProcess = null;
  if (queue.length !== 0) nextInQueue();
};

const unqueue = (id) => {
  queue = queue.filter((v) => v.id !== id);
};

const getQueueSize = () => queue.length;

module.exports = { enqueue, unqueue, getQueueSize };
