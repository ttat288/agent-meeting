# Local CLI discovery

Use the existing Agent Meeting command. In a source checkout, `node bin/cli.js` works without installation. Do not download a new CLI or change settings just to discover skills.

- `agent-meeting doctor`: local room/bridge/executable presence. Does not probe network, CLI registration, permission, model access or paid usage. It hides room keys and endpoints. If MCP was just connected, start a new CLI session.
- `agent-meeting skills list`: metadata of packaged skills.
- `agent-meeting skills list --local --query "topic"`: metadata from `.agents/skills` in cwd. `--dir <skills-directory>` selects another explicit catalog. Use `--offset`/`--limit` when nextOffset is present.
- `agent-meeting skills list --local --graph --query "network"`: additionally match paths explicitly referenced by SKILL.md. This is lexical path search, not semantic understanding of the reference contents.
- `agent-meeting skills inspect <id> --local`: graph of explicit links to references/scripts/assets, source SHA-256, available/blocked/missing status. It does not load resource bodies or recursively traverse links. Hash covers the manifest only, not all linked contents. Reinspect when source changes.
- `agent-meeting skills show <id> --local`: read one manifest. For a declared text resource: add `--resource references/file.md`. Apply the same --dir selection across commands.

The catalog skips symlinks and malformed/oversized manifests; it is not an inventory of global/CLI-native skills. The metadata reader supports simple inline or folded name/description fields, not general YAML. Explicit links are evidence of a reference, not authority to run a script. Inspect the skill scope and project rules before using it. Commands print files; they never install skills, register MCP or execute resource scripts.
