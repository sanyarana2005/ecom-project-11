/**
 * Utility function to get the display status for a booking
 * Only returns 'pending' or 'conducted' based on date
 * If the booking date is in the past, returns 'conducted'
 * Otherwise returns 'pending'
 */
export const getBookingDisplayStatus = (booking) => {
  if (!booking || !booking.start) {
    return 'pending';
  }

  const bookingDate = new Date(booking.start);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
  
  // Compare dates (ignore time)
  const bookingDateOnly = new Date(bookingDate);
  bookingDateOnly.setHours(0, 0, 0, 0);

  // If booking date is before today, show as 'conducted'
  if (bookingDateOnly < today) {
    return 'conducted';
  }

  // Otherwise always return 'pending' (ignore approved/rejected statuses)
  return 'pending';
};

