import { Recipe } from '../types';
import { z } from 'zod';

/**
 * LAMP stack recipe implementation
 */
export const lampRecipe: Recipe = {
  name: 'lamp',
  description: 'LAMP stack with configurable database, web server, and PHP version',
  options: {
    db: {
      description: 'Database type',
      default: 'mysql',
      choices: ['mysql', 'postgres'],
    },
    web: {
      description: 'Web server type',
      default: 'apache',
      choices: ['apache', 'nginx'],
    },
    php: {
      description: 'PHP version',
      default: '8.2',
    },
    dbVersion: {
      description: 'Database version',
      default: '8.0',
    },
    webVersion: {
      description: 'Web server version',
      default: '2.4',
    },
  },
  stack: {
    name: 'lamp-stack',
    services: {
      database: {
        image: 'mysql:8.0',
        environment: {
          MYSQL_ROOT_PASSWORD: 'devx',
          MYSQL_DATABASE: 'app',
          MYSQL_USER: 'devx',
          MYSQL_PASSWORD: 'devx',
        },
        volumes: ['db_data:/var/lib/mysql'],
        ports: ['3306:3306'],
      },
      webserver: {
        image: 'php:8.2-apache',
        volumes: ['./app:/var/www/html'],
        ports: ['80:80'],
        depends_on: ['database'],
        command: [
          'sh',
          '-c',
          'docker-php-ext-install pdo_mysql mysqli && apache2-foreground'
        ],
      },
    },
    volumes: {
      db_data: {},
    },
  },
}; 