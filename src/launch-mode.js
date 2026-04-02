export function hasDirectCommand(values) {
  return Boolean(
    values.quick ||
      values.collection ||
      values.current ||
      values["set-name"] !== undefined ||
      values["set-personality"] !== undefined ||
      values.backup ||
      values.restore
  );
}

export function shouldLaunchTui(values, streams = {}) {
  if (values.help || values.plain || hasDirectCommand(values)) {
    return false;
  }
  return Boolean((streams.stdinIsTTY ?? process.stdin.isTTY) && (streams.stdoutIsTTY ?? process.stdout.isTTY));
}
