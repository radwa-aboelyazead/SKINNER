export const FIELD_LIMITS = {
  name: 80,
  email: 120,
  phone: 24,
  address: 160,
  clinic: 160,
  message: 500,
  report: 2500,
};

export function sanitizeText(value = "", maxLength = 500) {
  return String(value)
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);
}

export function cleanText(value = "", maxLength = 500) {
  return sanitizeText(value, maxLength).trim();
}

export function sanitizeMultiline(value = "", maxLength = 2500) {
  return String(value)
    .replace(/[<>]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, maxLength);
}

export function cleanMultiline(value = "", maxLength = 2500) {
  return sanitizeMultiline(value, maxLength).trim();
}

export function digitsOnly(value = "") {
  return String(value).replace(/\D/g, "");
}

export function formatCardNumber(value = "") {
  return digitsOnly(value).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

export function getCardBrand(value = "") {
  const digits = digitsOnly(value);
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "AMEX";
  if (/^6(?:011|5)/.test(digits)) return "Discover";
  return "Card";
}

export function isValidEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}

export function isValidPhone(value = "") {
  return /^(\+20|0)(10|11|12|15)[0-9]{8}$/.test(String(value).trim());
}

export function getBirthDateFromNationalId(nationalId = "") {
  const cleanId = String(nationalId).trim();
  if (!/^[23][0-9]{13}$/.test(cleanId)) return null;
  const centuryDigit = Number(cleanId[0]);
  const yearPart = cleanId.slice(1, 3);
  const monthPart = cleanId.slice(3, 5);
  const dayPart = cleanId.slice(5, 7);
  
  const centuryPrefix = centuryDigit === 2 ? "19" : "20";
  const birthYear = Number(centuryPrefix + yearPart);
  const birthMonth = Number(monthPart) - 1; // 0-indexed month
  const birthDay = Number(dayPart);
  
  const birthDate = new Date(birthYear, birthMonth, birthDay);
  if (
    birthDate.getFullYear() !== birthYear ||
    birthDate.getMonth() !== birthMonth ||
    birthDate.getDate() !== birthDay
  ) {
    return null;
  }
  return birthDate;
}

export function calculateAge(birthDate) {
  if (!birthDate) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function isValidExpiry(value = "") {
  const match = String(value).trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  return new Date(year, month, 0, 23, 59, 59) >= new Date();
}

export function luhnCheck(value = "") {
  const digits = digitsOnly(value);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

export function validatePaymentForm(values, requireOtp = false) {
  const errors = {};
  if (!luhnCheck(values.cardNumber)) errors.cardNumber = "Enter a valid card number.";
  if (!cleanText(values.cardholderName, FIELD_LIMITS.name)) errors.cardholderName = "Cardholder name is required.";
  if (!isValidExpiry(values.expiryDate)) errors.expiryDate = "Use a future date in MM/YY format.";
  if (!/^\d{3,4}$/.test(digitsOnly(values.cvv))) errors.cvv = "CVV must be 3 or 4 digits.";
  if (requireOtp && digitsOnly(values.otp).length !== 6) errors.otp = "Enter the 6-digit OTP code.";
  return errors;
}

export function validateProfile(values, { role = "patient" } = {}) {
  const errors = {};
  if (cleanText(values.name, FIELD_LIMITS.name).length < 2) errors.name = "Name must be at least 2 characters.";
  if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
  if (values.phone && !isValidPhone(values.phone)) errors.phone = "Enter a valid Egyptian mobile number.";
  
  if (role === "patient") {
    if (cleanText(values.address, FIELD_LIMITS.address).length < 3) errors.address = "Address must be at least 3 characters.";
    if (values.age !== undefined) {
      const numericAge = Number(values.age);
      if (values.age === "" || isNaN(numericAge) || numericAge < 13 || numericAge > 100 || !Number.isInteger(numericAge)) {
        errors.age = "Age must be an integer between 13 and 100.";
      }
    }
  }

  if (role === "doctor") {
    const numericFee = Number(values.consultationFee);
    if (!Number.isFinite(numericFee) || numericFee < 50 || numericFee > 3000 || !Number.isInteger(numericFee)) {
      errors.consultationFee = "Consultation fee must be an integer between 50 and 3000 EGP.";
    }
    if (values.age !== undefined) {
      const numericAge = Number(values.age);
      if (values.age === "" || isNaN(numericAge) || numericAge < 23 || numericAge > 75 || !Number.isInteger(numericAge)) {
        errors.age = "Age must be an integer between 23 and 75.";
      }
    }
  }
  return errors;
}

export function validateMessage(value) {
  const message = cleanText(value, FIELD_LIMITS.message);
  if (!message) return "Message cannot be empty.";
  return "";
}

export function validateReport(value) {
  const report = cleanMultiline(value, FIELD_LIMITS.report);
  if (report.length < 40) return "Report must contain at least 40 characters.";
  return "";
}
