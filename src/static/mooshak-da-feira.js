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

  testNode.getElementsByClassName('test-result')[0].innerHTML = formatResult(
    data.status || 'UNKNOWN'
  );
  testNode.getElementsByClassName('test-stdout')[0].innerText = data.stdout;
  testNode.getElementsByClassName('test-stderr')[0].innerText = data.stderr;
  testNode.getElementsByClassName('test-code')[0].innerText = `Exit code: ${data.code || '0'}`;
  testNode.getElementsByClassName('test-signal')[0].innerText = `Exit signal: ${
    data.signal || 'none'
  }`;
});

socket.on('done', () => {
  submit.disabled = false;
});

const formatTags = (tags) => tags.map((tag) => `<span class="test-tag">${tag}</span>`);

const formatResult = (result) => {
  const color =
    {
      NOT_RAN: '#758173',
      GRADER_EXCEPTION: '#f00',
      COMPILE_ERROR: '#721121',
      TIME_LIMIT_EXCEEDED: '#A9640F',
      RUNTIME_ERROR: '#981F37',
      WRONG_ANSWER: '#A01821',
      SUCCESS: '#48653E',
    }[result] || '#000';
  return `<span class="test-tag" style="background: ${color};">${result.replace('_', ' ')}</span>`;
};

socket.on('tests', (tests) => {
  const testsDiv = document.getElementById('tests');

  globalTests = tests;

  testsDiv.innerHTML = '';

  tests.forEach(({ tags, description }, i) => {
    testsDiv.innerHTML += `
    <div class="test" id="test-${i}">
      <div class="test-header">
        <h4>Test ${i + 1}</h4>
        <p>${formatTags(tags)}</p>
        <p class="test-result">${formatResult('NOT_RAN')}</p>
      </div>
      <div class="test-content">
        <p>${description}</p>
        <p class="test-signal"></p>
        <p class="test-code"></p>
        <div class="test-output">
          <pre class="test-stdout"></pre>
          <pre class="test-stderr"></pre>
        </div>
      </div>
    </div>
  `;
  });
});
