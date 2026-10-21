'use strict';

// One complete, versioned snapshot for both admin and routing callers. Never write
// into the installed package; defaults remain in memory until the first save.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

function failure(code, message, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.code = code;
  return error;
}
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function regularFile(file) {
  const stat = fs.lstatSync(file);
  if (stat.size > 32 * 1024 * 1024) throw failure('CONFIG_CORRUPT', 'Saved state exceeds the 32 MiB safety limit; archive data before retrying.');
  if (!stat.isFile() || stat.isSymbolicLink()) throw failure('CONFIG_UNSAFE_PATH', 'Configuration must be a regular file.');
}

class ConfigStore {
  constructor({ dir, defaults, validate } = {}) {
    if (typeof defaults !== 'function' || typeof validate !== 'function') {
      throw new TypeError('ConfigStore requires defaults() and validate(config).');
    }
    this.dir = path.resolve(dir || process.env.AGENT_MEETING_CONFIG_DIR || path.join(os.homedir(), '.agent-meeting', 'config'));
    this.file = path.join(this.dir, 'config.json');
    this.backupFile = path.join(this.dir, 'config.json.bak');
    this.lockFile = path.join(this.dir, 'config.lock');
    this.validate = validate;
    this.defaults = defaults;
    this.initial = clone(defaults());
    this.initial.revision = 1;
    this._validate(this.initial);
  }

  _validate(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config) ||
        !Number.isSafeInteger(config.revision) || config.revision < 1) {
      throw failure('CONFIG_INVALID', 'Configuration requires a positive integer revision.');
    }
    this.validate(config);
  }

  _directory(create = false) {
    if (create) fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    let stat;
    try { stat = fs.lstatSync(this.dir); } catch (error) {
      if (!create && error.code === 'ENOENT') return false;
      throw error;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw failure('CONFIG_UNSAFE_PATH', 'Configuration directory must be a real directory.');
    }
    if (create) fs.chmodSync(this.dir, 0o700);
    return true;
  }

  read() {
    if (!this._directory()) return clone(this.initial);
    let raw;
    try {
      regularFile(this.file);
      raw = fs.readFileSync(this.file, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return clone(this.initial);
      throw error;
    }
    try {
      const config = JSON.parse(raw);
      this._validate(config);
      return clone(config);
    } catch (error) {
      throw failure('CONFIG_CORRUPT', 'Saved configuration is invalid; repair it or restore its backup.', error);
    }
  }

  _temporary(file, content) {
    const temp = `${file}.${process.pid}.${crypto.randomBytes(12).toString('hex')}.tmp`;
    let fd;
    try {
      fd = fs.openSync(temp, 'wx', 0o600);
      fs.writeFileSync(fd, content, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
      return temp;
    } catch (error) {
      if (fd !== undefined) fs.closeSync(fd);
      try { fs.unlinkSync(temp); } catch { /* only our randomly named temp */ }
      throw error;
    }
  }

  save(config, expectedRevision) {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
      throw failure('CONFIG_CONFLICT', 'An expected configuration revision is required.');
    }
    const next = clone(config);
    // The caller cannot choose the new revision.
    next.revision = expectedRevision + 1;
    this._validate(next);
    if (Buffer.byteLength(JSON.stringify(next)) > 32 * 1024 * 1024) throw failure('CONFIG_INVALID', 'State exceeds 32 MiB; export and archive older results.');
    this._directory(true);
    let lock;
    try { lock = fs.openSync(this.lockFile, 'wx', 0o600); } catch (error) {
      if (error.code === 'EEXIST') throw failure('CONFIG_LOCKED', 'Configuration is being saved; retry after the writer finishes.', error);
      throw error;
    }
    let temp;
    let backupTemp;
    try {
      fs.writeFileSync(lock, `${process.pid}\n`, 'utf8');
      const current = this.read();
      if (current.revision !== expectedRevision) {
        const error = failure('CONFIG_CONFLICT', 'Configuration changed; reload before saving.');
        error.currentRevision = current.revision;
        throw error;
      }
      temp = this._temporary(this.file, `${JSON.stringify(next, null, 2)}\n`);
      // Back up the complete previous snapshot, including packaged defaults for
      // the first save, before publishing the new snapshot with one rename.
      backupTemp = this._temporary(this.backupFile, `${JSON.stringify(current, null, 2)}\n`);
      fs.renameSync(backupTemp, this.backupFile);
      backupTemp = undefined;
      fs.renameSync(temp, this.file);
      temp = undefined;
      // Persist directory entries on systems that support directory fsync.
      let directory;
      try {
        directory = fs.openSync(this.dir, 'r');
        fs.fsyncSync(directory);
      } catch (error) {
        if (!['EINVAL', 'ENOTSUP', 'EISDIR', 'EPERM'].includes(error.code)) throw error;
      } finally { if (directory !== undefined) fs.closeSync(directory); }
      return clone(next);
    } finally {
      for (const ownTemp of [temp, backupTemp]) {
        if (ownTemp) { try { fs.unlinkSync(ownTemp); } catch { /* best effort cleanup */ } }
      }
      fs.closeSync(lock);
      fs.unlinkSync(this.lockFile);
    }
  }
}

module.exports = { ConfigStore };
