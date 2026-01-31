/* global Module */
/* global moment */

/* Magic Mirror
 * Module: MMM-NotionTasks
 *
 * By Jordan Welch
 * MIT Licensed.
 */

Module.register('MMM-NotionTasks', {
  defaults: {
    updateInterval: 60000,
    assigneeField: 'Assignee',
    dueDateField: 'Due',
    nameField: 'Name',
    statusField: 'Status',
    doneStatuses: ['Done'],
    nameFormat: 'full',
  },

  requiresVersion: '2.28.0',

  loading: true,

  start () {
    Log.info(`Starting module: ${this.name}`);
    const self = this;

    this.addFilters();
    this.getData();

    setInterval(() => {
      self.getData();
    }, this.config.updateInterval);
  },

  getData () {
    this.sendSocketNotification('MMM-NotionTasks-FETCH', {
      notionToken: this.config.notionToken,
      dataSourceId: this.config.dataSourceId,
      assigneeField: this.config.assigneeField,
      dueDateField: this.config.dueDateField,
      nameField: this.config.nameField,
      statusField: this.config.statusField,
      doneStatuses: this.config.doneStatuses,
      today: this.today(),
    });
  },

  getTemplate () {
    return 'MMM-NotionTasks.njk';
  },

  getTemplateData () {
    return {
      loading: this.loading,
      tasks: this.data?.tasks || [],
    };
  },

  getScripts () {
    return [
      'moment.js',
      'moment-timezone.js',
    ];
  },

  getStyles () {
    return [
      'font-awesome.css',
      'MMM-NotionTasks.css',
    ];
  },

  getTranslations () {
    return {
      en: 'translations/en.json',
      es: 'translations/es.json',
    };
  },

  socketNotificationReceived (notification, payload) {
    if (notification !== 'MMM-NotionTasks-DATA') {
      return;
    }

    this.loading = false;
    this.data.tasks = payload.tasks;
    this.updateDom(300);
  },

  addFilters () {
    this.nunjucksEnvironment().addFilter('name', (name) => {
      switch (this.config.nameFormat) {
        case 'first':
          return name.split(' ')[0];
        case 'last':
          return name.split(' ').slice(-1).join(' ');
        case 'initials':
          return name.split(' ').map((n) => n[0]).join('');
        case 'full':
        default:
          return name;
      }
    });
  },

  today () {
    return moment().format('YYYY-MM-DD');
  },
});
