// Совпадает с правилами бэкенда: латиница в адресе, домен из частей через точку, без лишних @, пробелов и «;»
const LOCAL = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_LABEL = /^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

export function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  const at = email.lastIndexOf("@");
  if (at <= 0 || email.indexOf("@") !== at) return false;
  const local = email.slice(0, at);
  const labels = email.slice(at + 1).split(".");
  return (
    local.length <= 64 &&
    LOCAL.test(local) &&
    labels.length >= 2 &&
    labels.every((label) => DOMAIN_LABEL.test(label)) &&
    /^[A-Za-z]{2,}$/.test(labels[labels.length - 1])
  );
}
