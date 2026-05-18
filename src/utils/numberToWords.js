const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function words(x) {
  if (x < 20) return ones[x];
  if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? " " + ones[x % 10] : "");
  if (x < 1000) return ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + words(x % 100) : "");
  if (x < 100000) return words(Math.floor(x / 1000)) + " Thousand" + (x % 1000 ? " " + words(x % 1000) : "");
  if (x < 10000000) return words(Math.floor(x / 100000)) + " Lakh" + (x % 100000 ? " " + words(x % 100000) : "");
  return words(Math.floor(x / 10000000)) + " Crore" + (x % 10000000 ? " " + words(x % 10000000) : "");
}

export function numberToWords(n) {
  const num = Math.round(n);
  if (!num) return "Zero Rupees Only";
  return words(num) + " Rupees Only";
}
