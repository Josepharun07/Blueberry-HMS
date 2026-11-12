import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('builds the desk day from integer counts and paise', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ arrivals: 2, departures: 1, in_house: 4 }])
      .mockResolvedValueOnce([{ occupied: 4, sellable: 8, cleaning: 1 }])
      .mockResolvedValueOnce([{ received: '150000' }])
      .mockResolvedValueOnce([
        {
          booking_id: 'booking-1',
          confirmation_number: 'BH1',
          room_number: '101',
          first_name: 'Ada',
          last_name: 'Lovelace',
        },
      ])
      .mockResolvedValueOnce([]);
    const service = new ReportsService(
      { query } as never,
      { getOrThrow: () => 'UTC' } as never,
    );

    const report = await service.desk(new Date('2026-11-12T00:30:00Z'));

    expect(report.date).toBe('2026-11-12');
    expect(report.arrivalsDue).toBe(2);
    expect(report.occupiedRooms).toBe(4);
    expect(report.occupancyPercent).toBe('50.0');
    expect(report.receivedToday).toBe('1500.00');
    expect(report.arrivals).toEqual([
      {
        bookingId: 'booking-1',
        confirmationNumber: 'BH1',
        roomNumber: '101',
        guestName: 'Ada Lovelace',
      },
    ]);
    expect(query.mock.calls[2][1]).toEqual(['2026-11-12', 'UTC']);
  });
});
