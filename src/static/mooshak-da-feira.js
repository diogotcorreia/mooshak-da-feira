const submit = document.getElementById('submit');
let globalTests = [];

const socket = io();

socket.on('connect', () => {
  socket.emit('tests');
});

submit.onclick = async () => {
  const content = document.getElementById('code').value;

  socket.emit('submit', content);
  submit.disabled = true;

  const lastrun = document.getElementById('last-run');
  lastrun.innerText = new Date().toLocaleString();
};

socket.on('result', ({ test, ...data }) => {
  const testNode = document.getElementById(`test-${test}`);

  testNode.getElementsByClassName('test-result')[0].innerText = data.status || 'UNKNOWN';
  testNode.getElementsByClassName('test-stdout')[0].innerText = data.stdout;
  testNode.getElementsByClassName('test-stderr')[0].innerText = data.stderr;
  testNode.getElementsByClassName('test-code')[0].innerText = `Exit code: ${data.code || '0'}`;
  testNode.getElementsByClassName('test-signal')[0].innerText = `Exit signal: ${data.code || '0'}`;
});

socket.on('done', () => {
  submit.disabled = false;
});

socket.on('tests', (tests) => {
  const testsDiv = document.getElementById('tests');

  globalTests = tests;

  tests.forEach(({ tags, description }, i) => {
    testsDiv.innerHTML += `
    <div class="test" id="test-${i}">
      <h4>Test ${i + 1}</h4>
      <p>${description}</p>
      <p>Tags: ${tags}</p>
      <p class="test-result">Not ran</p>
      <p class="test-stdout"></p>
      <p class="test-stderr"></p>
      <p class="test-code"></p>
      <p class="test-signal"></p>
    </div>
  `;
  });
});
