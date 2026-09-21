import { describe, expect, it, vi } from 'vitest';
import {
  appointmentInstant,
  appointmentDisplay,
  scheduleGroup,
  followUpSortValue,
} from '../../src/domain/scheduling';
vi.mock('server-only', () => ({}));
import { addressTimeZone } from '../../src/server/provider-location';
const clinic = 'America/Los_Angeles';
const visitor = 'America/Phoenix';
describe('clinic scheduling', () => {
  it('converts California 9 AM to Arizona 10 AM in winter and 9 AM in summer', () => {
    const winter = appointmentInstant('2027-01-15', '09:00', clinic);
    expect(winter).toBe('2027-01-15T17:00:00Z');
    expect(appointmentDisplay(winter, clinic, visitor)).toMatchObject({
      local: 'Jan 15, 2027, 10:00 AM MST',
      clinic: 'Jan 15, 2027, 9:00 AM PST',
      difference: 'Clinic is 1 hour behind you on this date.',
    });
    const summer = appointmentInstant('2027-07-15', '09:00', clinic);
    expect(summer).toBe('2027-07-15T16:00:00Z');
    expect(appointmentDisplay(summer, clinic, visitor).local).toContain('9:00 AM MST');
    expect(appointmentDisplay(summer, clinic, visitor).difference).toContain('Same time');
  });
  it('rejects skipped and repeated local times instead of guessing', () => {
    expect(() => appointmentInstant('2027-03-14', '02:30', clinic)).toThrow();
    expect(() => appointmentInstant('2027-11-07', '01:30', clinic)).toThrow();
    expect(() => appointmentInstant('2027-03-14', '09:00', clinic)).not.toThrow();
  });
  it('shows different calendar days when the visitor is across midnight', () => {
    expect(
      appointmentDisplay(appointmentInstant('2027-01-15', '23:30', clinic), clinic, visitor).local,
    ).toBe('Jan 16, 2027, 12:30 AM MST');
  });
  it('uses the clinic day for date-only reminders and the exact instant for appointments', () => {
    const record = {
      followUpOn: '2027-01-15',
      followUpCompletedAt: null,
      followUpAt: null,
      followUpTimeZone: clinic,
    };
    const midnightArizona = new Date('2027-01-16T07:30:00Z');
    expect(scheduleGroup(record, visitor, midnightArizona)).toBe('today');
    expect(
      scheduleGroup(
        { ...record, followUpAt: '2027-01-15T17:00:00Z' },
        visitor,
        new Date('2027-01-15T17:01Z'),
      ),
    ).toBe('overdue');
    expect(
      scheduleGroup(
        { ...record, followUpCompletedAt: '2027-01-15T18:00Z' },
        visitor,
        midnightArizona,
      ),
    ).toBe('completed');
  });
  it('orders appointments by instant even when clinic calendar days differ', () => {
    const first = {
      followUpAt: '2027-01-16T06:00:00Z',
      followUpOn: '2027-01-16',
      followUpTimeZone: 'America/New_York',
    };
    const second = {
      followUpAt: '2027-01-16T07:00:00Z',
      followUpOn: '2027-01-15',
      followUpTimeZone: clinic,
    };
    expect(followUpSortValue(first, visitor)).toBeLessThan(followUpSortValue(second, visitor));
    expect(followUpSortValue({ ...second, followUpAt: null }, visitor)).toBe(
      Date.parse('2027-01-15T08:00:00Z'),
    );
  });
  it('uses geographic boundaries rather than a statewide timezone', () => {
    const address = {
      addressLine1: '100 Example Street',
      addressLine2: null,
      city: 'Example',
      state: 'AZ',
      zip: '85001',
    };
    const result = (latitude: number, longitude: number) =>
      addressTimeZone(address, [{ ...address, id: '1', label: 'Example', latitude, longitude }]);
    expect(result(33.4484, -112.074)).toBe(visitor);
    expect(result(36.866, -109.052)).toBe('America/Denver'); // Navajo Nation observes DST.
    expect(result(32.791, -115.563)).toBe(clinic);
    expect(addressTimeZone(address, [])).toBeNull();
    expect(
      addressTimeZone(address, [
        { ...address, city: 'Other', id: '2', label: '', latitude: 33.4484, longitude: -112.074 },
      ]),
    ).toBeNull();
  });
});
