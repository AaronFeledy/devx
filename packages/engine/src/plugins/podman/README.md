# Podman Plugin

The Podman plugin provides container runtime management for DevX using Podman. It handles downloading and managing Podman binaries, configuring isolated environments, and supporting cross-platform operation.

## Features

- **Isolated Podman Installation**: Downloads and manages Podman binaries in `~/.devx/bin/podman`
- **Cross-Platform Support**: Works on Linux, macOS, and Windows
- **Rootless Operation**: Supports rootless containers where possible
- **VM Integration**: Automatically sets up VMs for macOS and Windows
- **Version Management**: Tracks and updates Podman versions
- **Isolated Storage**: Uses separate storage and runtime directories

## Configuration

The plugin creates the following directory structure:

```
~/.devx/
├── bin/
│   └── podman/
│       ├── bin/           # Podman binaries
│       └── config/        # Configuration files
├── podman/               # Container storage
└── run/                  # Runtime data
```

### Environment Variables

- `PODMAN_ROOT`: Path to container storage (`~/.devx/podman`)
- `PODMAN_RUNROOT`: Path to runtime data (`~/.devx/run`)

### Configuration Files

#### storage.conf

```ini
[storage]
driver = "overlay"
runroot = "~/.devx/run"
graphroot = "~/.devx/podman"

[engine]
cgroup_manager = "cgroupfs"
events_logger = "file"
machine_enabled = true  # For macOS/Windows
```

## Platform Support

### Linux
- Supports rootless containers if user namespaces are enabled
- Uses native Podman installation
- No VM required

### macOS
- Requires VM for container runtime
- Uses Podman machine for VM management
- Automatic VM setup and configuration

### Windows
- Requires WSL 2
- Uses Podman within WSL 2
- Automatic WSL 2 configuration

## Usage

```typescript
import { PodmanPlugin } from './index';

const plugin = new PodmanPlugin();
await plugin.initialize();

// Start a container
await plugin.start({
  name: 'my-stack',
  // ... other stack configuration
});

// Get container status
const status = await plugin.status({
  name: 'my-stack'
});

// Stop containers
await plugin.stop({
  name: 'my-stack'
});

// Clean up
await plugin.destroy({
  name: 'my-stack'
});
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure user namespaces are enabled on Linux
   - Check WSL 2 installation on Windows
   - Verify VM permissions on macOS

2. **VM Issues**
   - Restart Podman machine: `podman machine stop && podman machine start`
   - Check VM logs: `podman machine logs`

3. **Storage Issues**
   - Clean up storage: `podman system prune`
   - Check storage configuration in `~/.devx/bin/podman/config/storage.conf`

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
export PODMAN_DEBUG=true
```

## Development

### Testing

Run tests with:

```bash
bun test
```

### Building

Build the plugin with:

```bash
bun run build
```

## License

Apache 2.0 