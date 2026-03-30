# EarthLink CLI

Production CLI frontend for interacting with the EarthLink server.

## Requirements

- Node.js 20+
- Running EarthLink server API (default: `http://localhost:8000`)

## Run (no install/build)

```bash
./earthlink --help
```

Quick discovery:

```bash
./earthlink
./earthlink commands
./earthlink world --help
./earthlink location --help
```

Windows CMD:

```bat
earthlink.cmd --help
```

PowerShell:

```powershell
.\earthlink.ps1 --help
```

These launchers execute the bundled runtime at `bin/earthlink.js`.

## Usage

```bash
./earthlink ping
./earthlink world state
./earthlink world time --json
./earthlink world start
./earthlink world pause
./earthlink world reset
./earthlink location list --limit 10
./earthlink location show 10287
./earthlink location nearby 10287 --limit 5
./earthlink weather show 10287
./earthlink astronomy show 10287
./earthlink stream world
```

## Configuration

- CLI flag: `--url <apiUrl>`
- Env var: `EARTHLINK_API_URL`
- Default: `http://localhost:8000`

Resolution order:
1. `--url`
2. `EARTHLINK_API_URL`
3. default value

## License

[MIT](LICENSE)

