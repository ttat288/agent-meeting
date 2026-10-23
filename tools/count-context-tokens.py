#!/usr/bin/env python3
"""Optional dev measurement: pip-install tiktoken in a disposable venv, never runtime."""
import hashlib
import importlib.metadata
import json
import sys
import tiktoken

source = json.load(sys.stdin)
results = []
for case in source['cases']:
    item = {key: value for key, value in case.items() if key not in ('before', 'after')}
    for side in ('before', 'after'):
        parts = case[side]
        item[side] = {
            'utf8Bytes': sum(len(p.encode('utf-8')) for p in parts),
            'unicodeCharacters': sum(len(p) for p in parts),
            'sha256': hashlib.sha256(json.dumps(parts, ensure_ascii=False).encode()).hexdigest(),
            'tokens': {name: sum(len(tiktoken.get_encoding(name).encode(p, disallowed_special=())) for p in parts)
                       for name in ('cl100k_base', 'o200k_base')},
        }
    item['tokenReductionPercent'] = {name: round(100 * (1 - item['after']['tokens'][name] / item['before']['tokens'][name]), 2)
                                     for name in ('cl100k_base', 'o200k_base')}
    results.append(item)
json.dump({'schema': 'agent-meeting/context-measurements@1', 'tiktoken': importlib.metadata.version('tiktoken'),
           'scope': 'Exact counts for named encodings of synthetic tool-output payloads. Payload parts are not measured model turns. Excludes model output, hidden prompts, request envelopes, cache and billing; schema is measured separately. No paid model called.',
           'cases': results}, sys.stdout, ensure_ascii=False, indent=2)
print()
