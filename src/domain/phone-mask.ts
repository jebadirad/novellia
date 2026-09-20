// Format partial input without hiding invalid letters or extra digits from validation.
export function maskPhone(input: string, caret = input.length) {
  const extensionAt = input.search(/[ex#]/i);
  const base = extensionAt < 0 ? input : input.slice(0, extensionAt);
  const suffix = extensionAt < 0 ? '' : input.slice(extensionAt);
  if (!/^[\d\s()+.-]*$/.test(base)) return { value: input, caret };
  let digits = base.replace(/\D/g, '');
  const country = digits.startsWith('1');
  if (country) digits = digits.slice(1);
  const prefix = country ? '+1 ' : '';
  const number = !digits
    ? ''
    : digits.length <= 3
      ? `(${digits}`
      : digits.length <= 6
        ? `(${digits.slice(0, 3)}) ${digits.slice(3)}`
        : `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  const formattedBase = prefix + number;
  const value = formattedBase + (suffix ? ` ${suffix}` : '');
  if (extensionAt >= 0 && caret > extensionAt)
    return { value, caret: formattedBase.length + 1 + caret - extensionAt };
  const before = input.slice(0, caret).replace(/\D/g, '').length;
  let position = 0;
  let count = 0;
  while (position < formattedBase.length && count < before) {
    if (/\d/.test(formattedBase[position])) count++;
    position++;
  }
  return { value, caret: position };
}
