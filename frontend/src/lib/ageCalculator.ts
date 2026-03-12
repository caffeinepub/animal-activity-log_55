import type { Time } from '../backend';

export interface Age {
  years: number;
  months: number;
}

export function calculateAge(birthday: Time | undefined): Age | null {
  if (!birthday) return null;

  const birthDate = new Date(Number(birthday) / 1000000); // Convert nanoseconds to milliseconds
  const now = new Date();

  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  // Adjust if the current day is before the birth day in the month
  if (now.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  return { years, months };
}

export function formatAge(age: Age | null): string {
  if (!age) return 'Age unknown';

  const parts: string[] = [];
  if (age.years > 0) {
    parts.push(`${age.years} ${age.years === 1 ? 'year' : 'years'}`);
  }
  if (age.months > 0) {
    parts.push(`${age.months} ${age.months === 1 ? 'month' : 'months'}`);
  }

  if (parts.length === 0) {
    return 'Less than 1 month';
  }

  return parts.join(', ');
}
