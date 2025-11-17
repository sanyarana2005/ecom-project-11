import React, { createContext, useContext, useState } from 'react';
import apiService from '../services/api';
import notificationService from '../services/notificationService';

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load calendar events
  const loadCalendarEvents = React.useCallback(async (resourceId = null) => {
    try {
      setLoading(true);
      const events = await apiService.getCalendarEvents(resourceId);
      setCalendarEvents(events);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      notificationService.error('Error', 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load my bookings
  const loadMyBookings = React.useCallback(async () => {
    try {
      const bookings = await apiService.getMyBookings();
      setMyBookings(bookings);
    } catch (error) {
      console.error('Failed to load my bookings:', error);
    }
  }, []);

  // Load pending requests (for HOD)
  const loadPendingRequests = React.useCallback(async (departmentId = null) => {
    try {
      const requests = await apiService.getPendingBookings(departmentId);
      setPendingRequests(Array.isArray(requests) ? requests : []);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
      setPendingRequests([]);
    }
  }, []);

  // Submit booking request
  const submitBookingRequest = async (bookingData) => {
    try {
      setLoading(true);
      const response = await apiService.createBooking(bookingData);
      
      // Refresh data
      await loadCalendarEvents();
      await loadMyBookings();
      
      // Show appropriate notification based on response
      if (response.status === 'approved') {
        notificationService.bookingConfirmed(
          response.resource,
          new Date(response.start).toLocaleDateString(),
          new Date(response.start).toLocaleTimeString()
        );
      } else if (response.status === 'pending') {
        notificationService.bookingPending(
          response.resource,
          new Date(response.start).toLocaleDateString(),
          new Date(response.start).toLocaleTimeString()
        );
      }
      
      return { success: true, booking: response };
    } catch (error) {
      // Handle specific error types
      if (error.message.includes('clash') || error.message.includes('conflict')) {
        if (error.message.includes('timetable')) {
          notificationService.timetableConflict(bookingData.resource, bookingData.start);
        } else {
          notificationService.bookingConflict(bookingData.resource, bookingData.start);
        }
      } else {
        notificationService.error('Booking Failed', error.message);
      }
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Approve booking (HOD only)
  const approveBooking = async (bookingId) => {
    try {
      setLoading(true);
      const response = await apiService.approveBooking(bookingId);
      
      // Refresh data
      await loadPendingRequests();
      await loadCalendarEvents();
      
      notificationService.success('Booking Approved', 'The booking request has been approved');
      
      return { success: true, booking: response };
    } catch (error) {
      notificationService.error('Approval Failed', error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Reject booking (HOD only)
  const rejectBooking = async (bookingId, reason = '') => {
    try {
      setLoading(true);
      const response = await apiService.rejectBooking(bookingId, reason);
      
      // Refresh data
      await loadPendingRequests();
      
      notificationService.bookingRejected(reason);
      
      return { success: true, booking: response };
    } catch (error) {
      notificationService.error('Rejection Failed', error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get resource color for calendar display
  const getResourceColor = (resource) => {
    const colors = {
      'Seminar Hall': '#3b82f6', // Blue
      'Auditorium': '#ef4444',   // Red
      'Lab': '#22c55e'           // Green
    };
    return colors[resource] || '#6b7280';
  };

  // Get event type for calendar display
  const getEventType = (event) => {
    if (event.type === 'timetable') return 'timetable';
    if (event.status === 'approved') return 'approved';
    if (event.status === 'pending') return 'pending';
    if (event.status === 'conducted') return 'conducted';
    return 'free';
  };

  const value = {
    calendarEvents,
    myBookings,
    pendingRequests,
    loading,
    loadCalendarEvents,
    loadMyBookings,
    loadPendingRequests,
    submitBookingRequest,
    approveBooking,
    rejectBooking,
    getResourceColor,
    getEventType
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};
