nunjucks = require('../__mocks__/nunjucks');

translate = (str) => str;

let data;
let template;

describe('loading', () => {
  beforeEach(() => {
    data = { loading: true };
    template = nunjucks.render('MMM-NotionTasks.njk', data);
  });

  it('shows loading', () => {
    expect(template).toContain('LOADING');
  });
});

describe('with task data', () => {
  beforeEach(() => {
    data = { loading: false, tasks: [
      {
        id: 'page-id',
        name: 'Task 1',
        status: 'In Progress',
        assignee: 'User 1',
        isPastDue: false,
      },
      {
        id: 'page-id-2',
        name: 'Task 2',
        status: 'Not started',
        assignee: 'User 2',
        isPastDue: false,
      },
    ] };
    template = nunjucks.render('MMM-NotionTasks.njk', data);
  });

  it('has title', () => {
    expect(template).toContain('TASKS');
  });

  it('shows task list', () => {
    expect(template).toContain('Task 1');
    expect(template).toContain('Task 2');
    expect(template).toContain('User 1');
    expect(template).toContain('User 2');
  });
});

describe('no task data', () => {
  beforeEach(() => {
    data = { loading: false, tasks: [] };
    template = nunjucks.render('MMM-NotionTasks.njk', data);
  });

  it('shows no tasks message', () => {
    expect(template).toContain('EMPTY');
  });
});

describe('no past due task', () => {
  beforeEach(() => {
    data = { loading: false, tasks: [{
      id: 'page-id',
      name: 'Task 1',
      status: 'In Progress',
      assignee: 'User 1',
      isPastDue: false,
    }] };
    template = nunjucks.render('MMM-NotionTasks.njk', data);
  });

  it('does not show icon', () => {
    expect(template).not.toContain('fa-exclamation-circle');
  });
});

describe('past due task', () => {
  beforeEach(() => {
    data = { loading: false, tasks: [{
      id: 'page-id',
      name: 'Task 1',
      status: 'In Progress',
      assignee: 'User 1',
      isPastDue: true,
    }] };
    template = nunjucks.render('MMM-NotionTasks.njk', data);
  });

  it('shows icon', () => {
    expect(template).toContain('fa-exclamation-circle');
  });
});
