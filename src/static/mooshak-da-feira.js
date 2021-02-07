let highlightTimeout;

hljs.initHighlightingOnLoad();

const result = document.getElementById('result');
const submit = document.getElementById('submit');
const killBtn = document.getElementById('kill');

const socket = io();

killBtn.onclick = async () => {
  socket.emit('kill');
};

socket.on('connect', () => {
  submit.style.display = 'inline-block';
  killBtn.style.display = 'none';
});

submit.onclick = async () => {
  const content = document.getElementById('code').value;

  socket.emit('submit', content, skipMocks.checked);
  submit.style.display = 'none';
  killBtn.style.display = 'inline-block';

  const lastrun = document.getElementById('last-run');
  lastrun.innerText = new Date().toLocaleString();
};

socket.on('clear', () => {
  result.innerText = '';
});

const handleHighlight = () => {
  if (highlightTimeout) clearTimeout(highlightTimeout);
  highlightTimeout = setTimeout(() => hljs.highlightBlock(result), 500);
};

socket.on('result', (data) => {
  result.appendChild(document.createTextNode(data));
  handleHighlight();
});

socket.on('done', () => {
  handleHighlight();
  killBtn.style.display = 'none';
  submit.style.display = 'inline-block';
});
