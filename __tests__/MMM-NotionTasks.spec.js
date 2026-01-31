/* global moment */

require('../__mocks__/Module');
require('../__mocks__/globalLogger');

const name = 'MMM-NotionTasks';

let MMMNotionTasks;

beforeEach(() => {
  jest.resetModules();
  require('../MMM-NotionTasks');

  MMMNotionTasks = global.Module.create(name);
  MMMNotionTasks.setData({ name, identifier: `Module_1_${name}` });

  const date = new Date(2023, 9, 1); // October 1, 2023
  jest.useFakeTimers().setSystemTime(date);
});

afterEach(() => {
  jest.useRealTimers();
});

it('has a default config', () => {
  expect(MMMNotionTasks.defaults).toEqual({
    updateInterval: 60000,
    assigneeField: 'Assignee',
    dueDateField: 'Due',
    nameField: 'Name',
    statusField: 'Status',
    doneStatuses: ['Done'],
    nameFormat: 'full',
  });
});

it('requires expected version', () => {
  expect(MMMNotionTasks.requiresVersion).toBe('2.28.0');
});

it('inits module in loading state', () => {
  expect(MMMNotionTasks.loading).toBe(true);
});

describe('start', () => {
  const originalInterval = setInterval;
  const configObject = {
    notionToken: 'secret-token',
    dataSourceId: 'data-source-id',
    assigneeField: 'Assignee',
    dueDateField: 'Due',
    nameField: 'Name',
    statusField: 'Status',
    doneStatuses: ['Done'],
    today: '2023-10-01',
  };

  beforeEach(() => {
    MMMNotionTasks.setConfig(configObject);
    global.setInterval = jest.fn();
  });

  afterEach(() => {
    global.setInterval = originalInterval;
  });

  it('logs start of module', () => {
    MMMNotionTasks.start();

    expect(global.Log.info).toHaveBeenCalledWith('Starting module: MMM-NotionTasks');
  });

  it('requests data from node_helper with config variables', () => {
    MMMNotionTasks.start();

    expect(MMMNotionTasks.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-NotionTasks-FETCH', configObject);
  });

  test('interval requests data from node_helper', () => {
    MMMNotionTasks.start();
    global.setInterval.mock.calls[0][0]();

    expect(MMMNotionTasks.sendSocketNotification).toHaveBeenCalledTimes(2);
    expect(MMMNotionTasks.sendSocketNotification)
      .toHaveBeenCalledWith('MMM-NotionTasks-FETCH', configObject);
  });

  test('interval set starts with default value', () => {
    MMMNotionTasks.setConfig({ updateInterval: 100000 });
    MMMNotionTasks.start();

    expect(global.setInterval)
      .toHaveBeenCalledWith(expect.any(Function), 100000);
  });

  it('registers nunjucks filters', () => {
    MMMNotionTasks.start();

    expect(MMMNotionTasks._nunjucksEnvironment.addFilter)
      .toHaveBeenCalledWith('name', expect.any(Function));
  });
});

describe('getTemplate', () => {
  it('returns template path', () => {
    expect(MMMNotionTasks.getTemplate()).toBe('MMM-NotionTasks.njk');
  });
});

describe('getTemplateData', () => {
  it('returns template data when loading', () => {
    expect(MMMNotionTasks.getTemplateData()).toEqual({
      loading: true,
      tasks: [],
    });
  });

  it('returns template data when not loading', () => {
    MMMNotionTasks.loading = false;

    expect(MMMNotionTasks.getTemplateData()).toEqual({
      loading: false,
      tasks: [],
    });
  });

  it('returns any stored task data', () => {
    const data = { tasks: [
      {
        id: 'page-id',
        name: 'Task 1',
        status: 'In Progress',
        assignee: 'User 1',
        isPastDue: true,
      },
      {
        id: 'page-id-2',
        name: 'Task 2',
        status: 'Not started',
        assignee: 'User 2',
        isPastDue: false,
      },
    ] };
    MMMNotionTasks.loading = false;
    MMMNotionTasks.data = data;

    expect(MMMNotionTasks.getTemplateData()).toEqual({
      loading: false,
      tasks: data.tasks,
    });
  });
});

describe('getScripts', () => {
  it('returns scripts path', () => {
    expect(MMMNotionTasks.getScripts()).toEqual([
      'moment.js',
      'moment-timezone.js',
    ]);
  });
});

describe('getStyles', () => {
  it('returns styles path', () => {
    expect(MMMNotionTasks.getStyles()).toEqual([
      'font-awesome.css',
      'MMM-NotionTasks.css',
    ]);
  });
});

describe('socketNotificationReceived', () => {
  const payload = {
    tasks: [
      {
        id: 'page-id',
        name: 'Task 1',
        status: 'In Progress',
        assignee: 'User 1',
        isPastDue: true,
      },
      {
        id: 'page-id-2',
        name: 'Task 2',
        status: 'Not started',
        assignee: 'User 2',
        isPastDue: false,
      },
    ],
  };

  describe('notification is MMM-NotionTasks-DATA', () => {
    it('sets loading to false', () => {
      MMMNotionTasks.socketNotificationReceived('MMM-NotionTasks-DATA', payload);

      expect(MMMNotionTasks.loading).toBe(false);
    });

    it('sets task data', () => {
      MMMNotionTasks.socketNotificationReceived('MMM-NotionTasks-DATA', payload);

      expect(MMMNotionTasks.data.tasks).toBe(payload.tasks);
    });

    it('updates dom', () => {
      MMMNotionTasks.socketNotificationReceived('MMM-NotionTasks-DATA', payload);

      expect(MMMNotionTasks.updateDom).toHaveBeenCalled();
    });
  });

  describe('notification is not MMM-NotionTasks-DATA', () => {
    it('does not set data', () => {
      MMMNotionTasks.socketNotificationReceived('NOT-MMM-NotionTasks-DATA', payload);

      expect(MMMNotionTasks.data.stops).toEqual(undefined);
    });
  });
});

describe('addFilters', () => {
  describe('name filter', () => {
    const getFilter = () => MMMNotionTasks.nunjucksEnvironment()
      .addFilter.mock.calls
      .find((call) => call[0] === 'name')[1];

    it('registers a name filter', () => {
      MMMNotionTasks.addFilters();

      expect(MMMNotionTasks.nunjucksEnvironment().addFilter)
        .toHaveBeenCalledWith('name', expect.any(Function));
    });

    it('name filter returns name', () => {
      MMMNotionTasks.addFilters();
      const nameFilter = getFilter();

      expect(nameFilter('Jordan Welch')).toBe('Jordan Welch');
    });

    describe('config set to first name', () => {
      it('name filter returns first name', () => {
        MMMNotionTasks.config.nameFormat = 'first';
        MMMNotionTasks.addFilters();
        const nameFilter = getFilter();

        expect(nameFilter('Jordan Welch')).toBe('Jordan');
      });
    });

    describe('config set to last name', () => {
      it('name filter returns last name', () => {
        MMMNotionTasks.config.nameFormat = 'last';
        MMMNotionTasks.addFilters();
        const nameFilter = getFilter();

        expect(nameFilter('Jordan Welch')).toBe('Welch');
      });
    });

    describe('config set to initials', () => {
      it('name filter returns initials', () => {
        MMMNotionTasks.config.nameFormat = 'initials';
        MMMNotionTasks.addFilters();
        const nameFilter = getFilter();

        expect(nameFilter('Jordan Welch')).toBe('JW');
      });
    });

    describe('config set to full name', () => {
      it('name filter returns full name', () => {
        MMMNotionTasks.config.nameFormat = 'full';
        MMMNotionTasks.addFilters();
        const nameFilter = getFilter();

        expect(nameFilter('Jordan Welch')).toBe('Jordan Welch');
      });
    });
  });
});

describe('today', () => {
  it('returns today\'s date in YYYY-MM-DD format in UTC by default', () => {
    moment.tz.setDefault('UTC');
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2023, 9, 1, 0, 30)));

    expect(MMMNotionTasks.today()).toBe('2023-10-01');
  });

  it('will return today\'s date in YYYY-MM-DD format in a specific timezone', () => {
    moment.tz.setDefault('America/New_York');
    // 2023-09-30 in America/New_York (EDT, UTC-4).
    jest.useFakeTimers().setSystemTime(new Date(Date.UTC(2023, 9, 1, 0, 30)));

    expect(MMMNotionTasks.today()).toBe('2023-09-30');
  });
});
