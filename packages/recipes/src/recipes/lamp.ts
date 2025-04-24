import { Recipe, RecipeOptions, RecipeError } from '../types';
import type { StackConfig, ServiceConfig } from '@devx/stack'; // Assuming types are here
import { cloneDeep } from 'lodash-es'; // Revert to original import

// Define RecipeOptions based on the options defined in the recipe
// This should ideally be generated or inferred, but define manually for now
interface LampRecipeOptions extends RecipeOptions {
  db?: 'mysql' | 'postgres';
  web?: 'apache' | 'nginx';
  php?: string;
  dbVersion?: string;
  webVersion?: string;
}

/**
 * Transforms the base stack config based on user options.
 */
function transformLampStack(
  baseStack: StackConfig,
  options: LampRecipeOptions
): StackConfig {
  // Use lodash cloneDeep to avoid modifying the original recipe stack object
  const stackConfig = cloneDeep(baseStack);

  // --- Option Resolution ---
  // Use recipe defaults directly here since 'this' context is lost
  const dbType = options.db ?? 'mysql';
  const webType = options.web ?? 'apache';
  const phpVersion = options.php ?? '8.2';
  let dbVersion = options.dbVersion;
  let webVersion = options.webVersion;

  // --- Validation & Default Adjustments ---
  if (dbType === 'postgres' && options.dbVersion === undefined) {
    dbVersion = '15'; // Set a reasonable PG default
  } else if (dbType === 'mysql' && options.dbVersion === undefined) {
    dbVersion = '8.0'; // Set default mysql
  }

  if (webType === 'nginx' && options.webVersion === undefined) {
    webVersion = '1.25'; // Default nginx
  } else if (webType === 'apache' && options.webVersion === undefined) {
    webVersion = '2.4'; // Default apache
  }

  // Validate PHP Version (example: only support >= 7.4)
  const phpVersionFloat = parseFloat(phpVersion);
  if (isNaN(phpVersionFloat) || phpVersionFloat < 7.4) {
    throw new RecipeError(
      `Unsupported PHP version: ${phpVersion}. Requires PHP 7.4 or higher.`
    );
  }

  // Validate DB Version format (example: disallow 'latest')
  if (dbVersion === 'latest') {
    throw new RecipeError(
      `Database version cannot be 'latest'. Please specify a version number.`
    );
  }

  // Validate DB Type / Version dependencies
  if (dbType === 'postgres') {
    const dbVersionFloat = parseFloat(dbVersion ?? '0'); // Use the potentially adjusted dbVersion
    if (isNaN(dbVersionFloat) || dbVersionFloat < 10) {
      // Example: Require PG 10+
      throw new RecipeError(
        `Unsupported PostgreSQL version: ${dbVersion}. Requires version 10 or higher.`
      );
    }
  } else if (dbType === 'mysql') {
    const dbVersionFloat = parseFloat(dbVersion ?? '0');
    if (isNaN(dbVersionFloat) || dbVersionFloat < 5.7) {
      // Example: require MySQL 5.7+
      throw new RecipeError(
        `Unsupported MySQL version: ${dbVersion}. Requires version 5.7 or higher.`
      );
    }
  }

  // --- Configuration ---
  stackConfig.name = `lamp-${dbType}-${webType}-php${phpVersion}`;
  const dbService: ServiceConfig = stackConfig.services.database;
  const webService: ServiceConfig = stackConfig.services.webserver;

  // Configure Database Service
  if (dbType === 'mysql') {
    dbService.image = `mysql:${dbVersion}`;
    dbService.environment = {
      MYSQL_ROOT_PASSWORD: 'devx',
      MYSQL_DATABASE: 'app',
      MYSQL_USER: 'devx',
      MYSQL_PASSWORD: 'devx',
    };
    dbService.volumes = ['db_data:/var/lib/mysql'];
    dbService.ports = ['3306:3306'];
    stackConfig.volumes.db_data = {}; // Ensure volume definition exists
  } else if (dbType === 'postgres') {
    dbService.image = `postgres:${dbVersion}`;
    dbService.environment = {
      POSTGRES_PASSWORD: 'devx',
      POSTGRES_DB: 'app',
      POSTGRES_USER: 'devx',
    };
    dbService.volumes = ['db_data:/var/lib/postgresql/data'];
    dbService.ports = ['5432:5432'];
    stackConfig.volumes.db_data = {}; // Ensure volume definition exists
  } else {
    throw new Error(`Unsupported database type: ${dbType}`);
  }

  // Configure Web Server Service
  let phpExtensions: string[] = [];
  if (dbType === 'mysql') {
    phpExtensions = ['pdo_mysql', 'mysqli'];
  } else if (dbType === 'postgres') {
    phpExtensions = ['pdo_pgsql', 'pgsql'];
  }
  const installCmd =
    phpExtensions.length > 0
      ? `docker-php-ext-install ${phpExtensions.join(' ')} && `
      : '';

  if (webType === 'apache') {
    webService.image = `php:${phpVersion}-apache`; // Assuming standard PHP apache images
    webService.command = ['sh', '-c', `${installCmd}apache2-foreground`];
  } else if (webType === 'nginx') {
    // Nginx setup typically requires a separate PHP-FPM container
    // For simplicity here, let's assume an image exists that bundles them or adjust later.
    // A more robust solution would involve adding/configuring a php-fpm service.
    // Let's use a hypothetical combined image for now, similar to apache variant.
    // Or use a standard nginx image and require user to configure PHP-FPM connection.
    // Using `php:${phpVersion}-fpm` requires linking/networking to nginx.
    // Let's STICK TO a single webserver container for simplicity matching the original structure.

    // We need an image that runs nginx and php-fpm, or configure one.
    // Let's use a common pattern: nginx official + php-fpm official, requires networking adjustments.
    // Alternative: custom image or community image.
    // For now, let's just set the image name and command assuming a pre-built combined image exists (simplification!)
    webService.image = `nginx:${webVersion}`; // Placeholder - NEEDS ADJUSTMENT FOR PHP
    // This command is incorrect for standard nginx image. Needs PHP-FPM setup.
    // webService.command = ['nginx', '-g', 'daemon off;'];
    // TODO: Implement proper Nginx + PHP-FPM configuration. This might involve:
    // 1. Adding a separate php-fpm service.
    // 2. Configuring nginx to proxy pass to php-fpm.
    // 3. Modifying depends_on.
    // For now, let's throw an error indicating it's not fully supported yet in this basic transform.
    throw new RecipeError(
      `Nginx web server option currently requires manual PHP-FPM configuration in the generated stack.`
    );
    // Or, just stick to the apache example command structure for now, knowing it won't work for nginx:
    // webService.command = [
    //   'sh',
    //   '-c',
    //   `${installCmd}nginx -g \'daemon off;\'` // Incorrect, just a placeholder
    // ];
  } else {
    throw new Error(`Unsupported web server type: ${webType}`);
  }

  return stackConfig;
}

/**
 * LAMP stack recipe implementation
 */
export const lampRecipe: Recipe = {
  name: 'lamp',
  description:
    'LAMP stack with configurable database, web server, and PHP version',
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
      // Add validation/choices if specific versions are supported
    },
    dbVersion: {
      description: 'Database version',
      default: '8.0', // Default for mysql
      // Add validation based on db type
    },
    webVersion: {
      description: 'Web server version',
      default: '2.4', // Default for apache
      // Add validation based on web type
    },
  },
  // Base stack configuration - passed to transform function
  stack: {
    name: 'lamp-stack',
    services: {
      database: {
        // Placeholder - will be set by transform
        image: '',
        environment: {},
        volumes: [],
        ports: [],
      },
      webserver: {
        // Placeholder - will be set by transform
        image: '',
        volumes: ['./app:/var/www/html'], // Keep app mount consistent
        ports: ['80:80'],
        depends_on: ['database'],
        command: [],
      },
    },
    volumes: {
      db_data: {},
    },
  } as unknown as StackConfig, // Cast needed as base might not be complete

  // Remove the invalid transform property, logic moved outside
  // transform(options: RecipeOptions): StackConfig { ... }
};
