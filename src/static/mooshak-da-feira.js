const submit = document.getElementById('submit');
let globalTests = [];
var testCounter = 0;
var testEvaluated = 1;
var successCounter = 0;
var failedCounter = 0;
var runtimeErrorCounter = 0;
const socket = io();

const resultColors = {
  NOT_RAN: '#758173',
  GRADER_EXCEPTION: '#f00',
  COMPILE_ERROR: '#721121',
  TIME_LIMIT_EXCEEDED: '#A9640F',
  RUNTIME_ERROR: '#981F37',
  WRONG_ANSWER: '#A01821',
  SUCCESS: '#48653E',
};

socket.on('connect', () => {
  socket.emit('tests');
});

const reset = () => {
  globalTests.forEach((_, i) => {
    const header = document.getElementById(`test-header-${i}`);
    header.getElementsByClassName('test-result')[0].innerHTML = formatResult('NOT_RAN');
    document.getElementById(`test-button-${i}`).style.borderColor = resultColors['NOT_RAN'];
    document.querySelector(`#test-${i} .output`).innerHTML = '';
    const summary = document.getElementById('summary');
    const el = document.getElementById(`test-button-${i}`);
    const panel = el.nextElementSibling;
    panel.style.maxHeight = null;
    summary.innerHTML = 'Waiting for tests to run...';
    testEvaluated = 1;
    failedCounter = 0;
  });
  testEvaluated = 1;
};

const toggleButton = (test) => {
  const el = document.getElementById(`test-button-${test}`);
  el.classList.toggle('active');
  const panel = el.nextElementSibling;
  panel.style.maxHeight = panel.scrollHeight + 'px';
};

submit.onclick = async () => {
  const content = document.getElementById('code').value;

  socket.emit('submit', content);
  submit.disabled = true;

  const lastrun = document.getElementById('last-run');
  lastrun.innerText = new Date().toLocaleString();
  reset();
};

socket.on('result', ({ test, ...data }) => {
  const testNode = document.getElementById(`test-${test}`);
  const header = document.getElementById(`test-header-${test}`);
  header.getElementsByClassName('test-result')[0].innerHTML = formatResult(
    data.status || 'UNKNOWN'
  );

  const outputNode = testNode.getElementsByClassName('output')[0];
  outputNode.innerText += data.stdout || '';
  if (data.stderr) {
    const stderrNode = document.createElement('span');
    stderrNode.className = 'output-error';
    stderrNode.innerText = data.stderr;
    outputNode.appendChild(stderrNode);
  }

  testNode.getElementsByClassName('test-code')[0].innerText = `Exit code: ${data.code || '0'}`;
  testNode.getElementsByClassName('test-signal')[0].innerText = `Exit signal: ${
    data.signal || 'none'
  }`;

  document.getElementById(`test-button-${test}`).style.borderColor =
    resultColors[data.status] || '#000';
  if (data.status != 'SUCCESS') {
    toggleButton(test);
    ++failedCounter;
  } else if (data.status == 'RUNTIME_ERROR') ++runtimeErrorCounter;
  else ++successCounter;
  const progress = document.getElementById('progressBar');
  progress.innerHTML = `${testEvaluated} / ${testCounter}`;
  if (testEvaluated == testCounter) {
    progress.innerHTML += ' All Done!';
    const summary = document.getElementById('summary');
    summary.innerHTML = '';
    if (failedCounter != 0) {
      summary.innerHTML = `
      <div>Tests Passed: ${successCounter}</div>
      <div>Tests Failed: ${failedCounter}</div>
      <div>Run Time Error: ${runtimeErrorCounter}</div>
      <div>Total Tests: ${testCounter}</div>
      `;
    } else summary.innerHTML = 'Go grab your 20 ;)';
  }
  ++testEvaluated;
});

socket.on('done', () => {
  submit.disabled = false;
});

const formatTags = (tags) => tags.map((tag) => `<span class="test-tag">${tag}</span>`);

const formatResult = (result) => {
  const color = resultColors[result] || '#000';
  return `<span class="test-tag" style="background: ${color};">${result.replace('_', ' ')}</span>`;
};

const injectAccordionListeners = () => {
  /* used for results buttons animations*/
  const acc = document.getElementsByClassName('accordion');

  [...acc].forEach((el) =>
    el.addEventListener('click', () => {
      el.classList.toggle('active');
      const panel = el.nextElementSibling;
      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    })
  );
};

socket.on('tests', (tests) => {
  const testsDiv = document.getElementById('tests');

  globalTests = tests;

  testsDiv.innerHTML = '';

  tests.forEach(({ tags, description, input, output }, i) => {
    testsDiv.innerHTML += `<button class="accordion" id="test-button-${i}" style="border-color: ${
      resultColors['NOT_RAN']
    };">
      <div class="test-header" id="test-header-${i}">
        <h4>Test ${i + 1}</h4>
        <p>${formatTags(tags)}</p>
        <p class="test-result">${formatResult('NOT_RAN')}</p>
      </div></button>
      <div class="panel">
        <div class="test" id="test-${i}">
          <div class="test-content">
            <p>${description}</p>
            <p class="test-signal"></p>
            <p class="test-code"></p>
          </div>
          <div class="blocks">
            <div class="block">
              <p>Input</p>
              <pre class="test-codeblock input"></pre>
            </div>
            <div class="block">
              <p>Expected Output</p>
              <pre class="test-codeblock expected-output"></pre>
            </div>
            <div class="block">
              <p>Program Output</p>
              <pre class="test-codeblock output"></pre>
            </div>
          </div>
        </div>
      </div>
      `;

    document.querySelector(`#test-${i} .input`).innerText = input || '';
    document.querySelector(`#test-${i} .expected-output`).innerText = output || '';

    injectAccordionListeners();
    ++testCounter;
  });
});
