// Rejects numeric passwords made of sequential, repeated or otherwise easy-to-guess digits.
const COMMON_WEAK_DIGITS = new Set([
  "000000", "111111", "222222", "333333", "444444", "555555",
  "666666", "777777", "888888", "999999",
  "00000000", "11111111", "22222222", "33333333", "44444444",
  "55555555", "66666666", "77777777", "88888888", "99999999",
  "123456", "654321", "012345", "543210", "12345678", "87654321",
  "01234567", "76543210",
  "121212", "212121", "123123", "321321", "112233", "332211",
  "12121212", "21212121", "12341234", "43214321", "11223344", "44332211",
  "102030", "010203", "135790", "097531", "159753", "159357",
  "789456", "147258", "258369", "246800", "135791", "369258",
]);

function hasSequentialDigits(pin) {
  let ascending = true;
  let descending = true;
  for (let i = 1; i < pin.length; i += 1) {
    const step = Number(pin[i]) - Number(pin[i - 1]);
    if (step !== 1) ascending = false;
    if (step !== -1) descending = false;
  }
  return ascending || descending;
}

function hasRepeatedDigits(pin) {
  return /^(\d)\1+$/.test(pin);
}

function hasRepeatedBlock(pin) {
  for (let size = 1; size <= pin.length / 2; size += 1) {
    if (pin.length % size !== 0) continue;
    if (pin.slice(0, size).repeat(pin.length / size) === pin) return true;
  }
  return false;
}

// Returns true for passwords that are all the same, sequential (growing or
// shrinking) or built from a repeated block (e.g. 121212, 12341234).
export function isWeakPassword(pin) {
  if (!/^\d+$/.test(pin)) return false;
  return hasRepeatedDigits(pin) || hasRepeatedBlock(pin) || hasSequentialDigits(pin) || COMMON_WEAK_DIGITS.has(pin);
}
