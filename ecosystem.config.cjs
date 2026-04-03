module.exports = {
  apps: [
    {
      name: 'alpax-agent-zero-dashboard',
      script: '.next/standalone/server.js',
      cwd: '.',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
      error_file: './logs/dashboard-err.log',
      out_file: './logs/dashboard-out.log',
      log_file: './logs/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      kill_timeout: 5000,
      restart_delay: 4000,
    },
  ],
};
