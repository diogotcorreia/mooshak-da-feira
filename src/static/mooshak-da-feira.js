const submit = document.getElementById('submit');
let globalTests = [];

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
  });
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
  testNode.getElementsByClassName('test-stdout')[0].innerText = data.stdout;
  testNode.getElementsByClassName('test-stderr')[0].innerText = data.stderr;
  testNode.getElementsByClassName('test-code')[0].innerText = `Exit code: ${data.code || '0'}`;
  testNode.getElementsByClassName('test-signal')[0].innerText = `Exit signal: ${
    data.signal || 'none'
  }`;

  document.getElementById(`test-button-${test}`).style.borderColor =
    resultColors[data.status] || '#000';
  if (data.status != 'SUCCESS') toggleButton(test);
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

  tests.forEach(({ tags, description }, i) => {
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
            <div class="test-output">
              <pre class="test-stdout"></pre>
              <pre class="test-stderr"></pre>
            </div>
          </div>
          <div class="block">
            <p>Input</p>
            <textarea id="code" rows="30" cols="60"></textarea>
          </div>
          <div class="block">
            <p>Expected Output</p>
            <textarea id="code" rows="30" cols="60"></textarea>
          </div>
          <div class="block">
            <p>Program Output</p>
            <textarea id="code" rows="30" cols="60"></textarea>
          </div>
        </div>
	    </div>
      `;
    injectAccordionListeners();
  });
});
