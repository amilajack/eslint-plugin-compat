// @flow
const targets = ['safari', 'chrome', 'edge', 'firefox'];

type Test = {
  name?: string,
  id: string,
  code: string,
  pass: bool,
  targets: string[]
}

const tests: Test[] = [
  {
    id: 'serviceworkers',
    code: 'new ServiceWorker()',
    pass: true,
    targets: ['chrome', 'firefox']
  },
  {
    id: 'queryselector',
    code: "document.querySelector('.some');",
    pass: true,
    targets
  },
  {
    id: 'document-currentscript',
    code: "document.currentScript('.some');",
    pass: true,
    targets
  },
  {
    name: 'document-currentscript, accept no args',
    id: 'document-currentscript',
    code: 'document.currentScript()',
    pass: true,
    targets
  },
  {
    name: 'document-currentscript, accept no semi',
    id: 'document-currentscript',
    code: 'document.currentScript();',
    pass: true,
    targets
  },
  {
    name: 'document-currentscript, fail on ',
    id: 'document-currentscript',
    code: "document.currentScript('.some');",
    pass: false,
    targets: [...targets, 'op_mini']
  }
];

export default tests;
