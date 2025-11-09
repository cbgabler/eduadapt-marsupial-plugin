jest.mock('electron', () => {
  const createMockWindow = () => ({
    loadURL: jest.fn(),
    loadFile: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
    },
  });

  const mockBrowserWindow = jest.fn(() => createMockWindow());

  const mockApp = {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(),
    get isPackaged() {
      return global.__TEST_IS_PACKAGED__ ?? false;
    },
  };

  return {
    app: mockApp,
    BrowserWindow: mockBrowserWindow,
  };
});

const electron = require('electron');
const { createWindow } = require('../main');

describe('createWindow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.__TEST_IS_PACKAGED__;
  });

  test('loads dev server upon run', () => {
    global.__TEST_IS_PACKAGED__ = false;

    createWindow();

    expect(electron.BrowserWindow).toHaveBeenCalledTimes(1);

    const windowInstance =
      electron.BrowserWindow.mock.results[electron.BrowserWindow.mock.results.length - 1]
        .value;
    expect(windowInstance.loadURL).toHaveBeenCalledWith('http://localhost:5173');
  });

});
