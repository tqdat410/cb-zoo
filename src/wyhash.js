const secret = [
  0xa0761d6478bd642fn,
  0xe7037ed1a0b428dbn,
  0x8ebc6af09c88c6e3n,
  0x589965cc75374cc3n
];

const encoder = new TextEncoder();

function read(data, offset, bytes) {
  let result = 0n;
  for (let index = 0; index < bytes && offset + index < data.length; index += 1) {
    result |= BigInt(data[offset + index]) << (BigInt(index) * 8n);
  }
  return BigInt.asUintN(64, result);
}

function mum(left, right) {
  const product = left * right;
  return [BigInt.asUintN(64, product), BigInt.asUintN(64, product >> 64n)];
}

function mix(left, right) {
  const [mulLeft, mulRight] = mum(left, right);
  return mulLeft ^ mulRight;
}

function sum64(seed, input) {
  let first;
  let second;
  let state = seed ^ mix(seed ^ secret[0], secret[1]);
  const length = input.length;

  if (length <= 16) {
    if (length >= 4) {
      const end = length - 4;
      const quarter = (length >> 3) << 2;
      first = (read(input, 0, 4) << 32n) | read(input, quarter, 4);
      second = (read(input, end, 4) << 32n) | read(input, end - quarter, 4);
    } else if (length > 0) {
      first = (BigInt(input[0]) << 16n) | (BigInt(input[length >> 1]) << 8n) | BigInt(input[length - 1]);
      second = 0n;
    } else {
      first = 0n;
      second = 0n;
    }
  } else {
    const states = [state, state, state];
    let index = 0;

    if (length >= 48) {
      while (index + 48 < length) {
        for (let offset = 0; offset < 3; offset += 1) {
          const left = read(input, index + 8 * (2 * offset), 8);
          const right = read(input, index + 8 * (2 * offset + 1), 8);
          states[offset] = mix(left ^ secret[offset + 1], right ^ states[offset]);
        }
        index += 48;
      }
      states[0] ^= states[1] ^ states[2];
    }

    const remaining = input.subarray(index);
    let remainingIndex = 0;
    while (remainingIndex + 16 < remaining.length) {
      states[0] = mix(read(remaining, remainingIndex, 8) ^ secret[1], read(remaining, remainingIndex + 8, 8) ^ states[0]);
      remainingIndex += 16;
    }

    first = read(input, length - 16, 8);
    second = read(input, length - 8, 8);
    state = states[0];
  }

  first ^= secret[1];
  second ^= state;
  [first, second] = mum(first, second);
  return mix(first ^ secret[0] ^ BigInt(length), second ^ secret[1]);
}

export function wyhash(seed, key) {
  return sum64(BigInt.asUintN(64, seed), encoder.encode(key));
}
