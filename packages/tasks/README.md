# @devx/tasks

Transactional task execution system for DevX. This package provides a robust way to execute sequences of commands and functions with automatic rollback support.

## Features

- Execute commands on host or in containers
- Support for both bash and PowerShell environments
- Transactional execution with automatic rollback
- Type-safe task definitions using Zod schemas
- Support for both command and function-based steps

## Installation

```bash
bun add @devx/tasks
```

## Usage

### Basic Task Execution

```typescript
import { TaskExecutor, Task, Command } from '@devx/tasks';

const task: Task = {
  name: 'setup-database',
  steps: [
    // Execute a command on the host
    { exec: 'mkdir -p ./data' },
    
    // Execute a command in a container
    { exec: 'mysql -u root -p"password" -e "CREATE DATABASE myapp"', container: 'mysql' },
    
    // Execute a function
    async () => {
      console.log('Database setup complete');
    }
  ],
  rollback: [
    // Cleanup steps if something fails
    { exec: 'rm -rf ./data' },
    { exec: 'mysql -u root -p"password" -e "DROP DATABASE myapp"', container: 'mysql' }
  ]
};

const executor = new TaskExecutor();
const result = await executor.execute(task);

if (result.success) {
  console.log('Task completed successfully');
} else {
  console.error('Task failed:', result.error);
}
```

### Command Options

Commands can be executed in different environments:

```typescript
const command: Command = {
  exec: 'echo "Hello World"',
  env: 'bash', // or 'powershell'
  container: 'my-container' // optional
};
```

### Error Handling

The TaskExecutor automatically handles rollback steps if any step fails:

1. If a step fails, all completed steps are recorded
2. Rollback steps are executed in reverse order
3. Each rollback step is executed independently (failures in rollback don't stop other rollback steps)
4. The original error is preserved in the TaskResult

## API Reference

### Types

- `Task`: Defines a sequence of steps to execute
- `TaskStep`: A single step (either a Command or function)
- `Command`: A command to execute (with optional container and environment)
- `TaskResult`: Result of task execution
- `Environment`: Type of environment ('bash' | 'powershell')

### Classes

- `TaskExecutor`: Main class for executing tasks with rollback support

## Contributing

See the main DevX repository for contribution guidelines. 