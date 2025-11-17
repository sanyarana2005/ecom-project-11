import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import BookingForm from './BookingForm';
import EventInfoModal from './EventInfoModal';
import BookingSidePanel from './BookingSidePanel';
import { getBookingDisplayStatus } from '../utils/bookingUtils';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { 
    calendarEvents, 
    myBookings, 
    loading, 
    loadCalendarEvents, 
    loadMyBookings,
    getEventType 
  } = useBooking();
  
  const [view] = useState('dayGridMonth');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (user) {
      loadCalendarEvents();
      loadMyBookings();
    }
  }, [user, loadCalendarEvents, loadMyBookings]);

  const handleLogout = () => {
    logout();
  };

  const handleEditBooking = (booking) => {
    // Set the booking date for editing
    setSelectedDate(new Date(booking.start));
    setShowBookingForm(true);
    // You can pass the booking data to BookingForm for editing
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const apiService = (await import('../services/api')).default;
      await apiService.cancelBooking(bookingId);
      // Refresh bookings
      loadMyBookings();
      loadCalendarEvents();
      // Show success notification
      const notificationService = (await import('../services/notificationService')).default;
      notificationService.success('Booking Cancelled', 'Your booking has been cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      const notificationService = (await import('../services/notificationService')).default;
      notificationService.error('Cancellation Failed', error.message || 'Failed to cancel booking');
    }
  };

  const handleDateClick = (arg) => {
    try {
      const clickedDateTime = arg?.date;
      if (!clickedDateTime) return;
      
      const weekday = clickedDateTime.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Show message if weekend is clicked (but still allow viewing events)
      if (weekday === 0 || weekday === 6) {
        // Still allow viewing events on weekends, just prevent booking
        setModalDate(clickedDateTime);
        setShowEventModal(true);
        return;
      }
      
      // Set the date for the modal
      setModalDate(clickedDateTime);
      setShowEventModal(true);
    } catch (error) {
      console.error('Error handling date click:', error);
    }
  };

  const handleEventClick = (info) => {
    try {
      const event = info.event;
      const eventDate = event.start;
      
      if (eventDate) {
        // Open the modal with the event's date
        setModalDate(eventDate);
        setShowEventModal(true);
      }
    } catch (error) {
      console.error('Error handling event click:', error);
    }
  };

  const formatCalendarEvents = () => {
    try {
      if (!calendarEvents || calendarEvents.length === 0) {
        return [];
      }
      return calendarEvents.map(event => {
        const eventType = getEventType(event);
        
        // Format time for display
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        const startTime = startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const endTime = endDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        
        // Create title - Gantt chart style (time and title inline)
        const timeStr = `${startTime} - ${endTime}`;
        const eventTitle = `${event.title || 'Event'}`;
        
        // Calculate duration in hours
        const durationMs = endDate - startDate;
        const durationHours = Math.round(durationMs / (1000 * 60 * 60));
        const durationText = durationHours === 1 ? '1 hour' : `${durationHours} hours`;
        
        // Gantt chart style - light colors with dark text
        let backgroundColor, textColor, className, resourceIcon;

        switch (eventType) {
          case 'timetable':
            backgroundColor = '#fce7f3'; // Light pink
            textColor = '#9f1239';
            className = 'fc-timetable-event';
            resourceIcon = 'train';
            break;
          case 'approved':
            // Color based on resource type - transparent colors
            if (event.resource === 'Seminar Hall') {
              backgroundColor = 'rgba(59, 130, 246, 0.3)'; // Transparent Blue
              textColor = '#1e40af'; // Dark blue text
              resourceIcon = 'building';
            } else if (event.resource === 'Auditorium') {
              backgroundColor = 'rgba(239, 68, 68, 0.3)'; // Transparent Red
              textColor = '#991b1b'; // Dark red text
              resourceIcon = 'building';
            } else if (event.resource === 'Lab') {
              backgroundColor = 'rgba(34, 197, 94, 0.3)'; // Transparent Green
              textColor = '#166534'; // Dark green text
              resourceIcon = 'flask';
            } else {
              backgroundColor = 'rgba(59, 130, 246, 0.3)'; // Default transparent blue
              textColor = '#1e40af';
              resourceIcon = 'building';
            }
            className = 'fc-approved-event';
            break;
          case 'pending':
            // Show resource colors matching legend - transparent
            if (event.resource === 'Seminar Hall') {
              backgroundColor = 'rgba(59, 130, 246, 0.3)'; // Transparent Blue
              textColor = '#1e40af'; // Dark blue text
              resourceIcon = 'building';
            } else if (event.resource === 'Auditorium') {
              backgroundColor = 'rgba(239, 68, 68, 0.3)'; // Transparent Red
              textColor = '#991b1b'; // Dark red text
              resourceIcon = 'building';
            } else if (event.resource === 'Lab') {
              backgroundColor = 'rgba(34, 197, 94, 0.3)'; // Transparent Green
              textColor = '#166534'; // Dark green text
              resourceIcon = 'flask';
            } else {
              backgroundColor = 'rgba(254, 243, 199, 0.5)'; // Light yellow for unknown resource
              textColor = '#92400e';
              resourceIcon = 'clock';
            }
            className = 'fc-pending-event';
            break;
          case 'conducted':
            // Show resource colors for conducted events - slightly muted but visible
            if (event.resource === 'Seminar Hall') {
              backgroundColor = 'rgba(59, 130, 246, 0.4)'; // Slightly more opaque Blue
              textColor = '#1e40af'; // Dark blue text
              resourceIcon = 'building';
            } else if (event.resource === 'Auditorium') {
              backgroundColor = 'rgba(239, 68, 68, 0.4)'; // Slightly more opaque Red
              textColor = '#991b1b'; // Dark red text
              resourceIcon = 'building';
            } else if (event.resource === 'Lab') {
              backgroundColor = 'rgba(34, 197, 94, 0.4)'; // Slightly more opaque Green
              textColor = '#166534'; // Dark green text
              resourceIcon = 'flask';
            } else {
              backgroundColor = 'rgba(147, 197, 253, 0.4)'; // Light blue for unknown resource
              textColor = '#1e40af';
              resourceIcon = 'clock';
            }
            className = 'fc-conducted-event';
            break;
          default:
            backgroundColor = '#f3f4f6'; // Light gray
            textColor = '#374151';
            className = 'fc-free-slot';
            resourceIcon = 'event';
        }

        // Format title for Gantt chart style: "Time • Title • Duration"
        const ganttTitle = `${timeStr} • ${eventTitle} • ${durationText}`;

        return {
          id: event.id,
          title: ganttTitle,
          start: event.start,
          end: event.end,
          backgroundColor,
          borderColor: backgroundColor, // Match border to background
          textColor,
          classNames: [className],
          extendedProps: {
            ...event,
            resourceIcon,
            eventType
          }
        };
      });
    } catch (error) {
      console.error('Error formatting calendar events:', error);
      return [];
    }
  };


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-black border-4 border-black flex items-center justify-center mr-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-black tracking-wide">
                BookMyCampus
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="px-6 py-3">
                <p className="text-xl font-black text-black uppercase tracking-wide">
                  Hello {user.role === 'student' ? <span className="text-purple-600">STUDENT</span> : user.role === 'teacher' ? <span className="text-purple-600">TEACHER</span> : <span className="text-purple-600">HOD</span>}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center justify-center w-12 h-12 border-4 border-black rounded-full hover:shadow-brutal transition-all cursor-pointer overflow-hidden p-0"
                >
                  <img 
                    src="/profile-icon.png" 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </button>
                
                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border-4 border-black shadow-brutal z-20">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Settings functionality can be added here
                        }}
                        className="w-full text-left px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors"
                      >
                        Settings
                      </button>
                      <div className="border-t-2 border-black"></div>
              <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-3 text-black font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portal Information Banner */}
        <div className="rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden" style={{ backgroundColor: '#FFC909' }}>
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Large Circle */}
            <div 
              className="absolute rounded-full"
              style={{
                width: '200px',
                height: '200px',
                backgroundColor: '#000000',
                opacity: 0.05,
                top: '-50px',
                right: '10%',
                transform: 'rotate(15deg)'
              }}
            />
            {/* Medium Circle */}
            <div 
              className="absolute rounded-full"
              style={{
                width: '150px',
                height: '150px',
                backgroundColor: '#5A4635',
                opacity: 0.06,
                bottom: '-30px',
                left: '5%',
                transform: 'rotate(-10deg)'
              }}
            />
            {/* Small Circle */}
            <div 
              className="absolute rounded-full"
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: '#000000',
                opacity: 0.05,
                top: '50%',
                left: '20%',
                transform: 'translateY(-50%)'
              }}
            />
            {/* Geometric Shape - Triangle */}
            <div 
              style={{
                position: 'absolute',
                width: '0',
                height: '0',
                borderLeft: '80px solid transparent',
                borderRight: '80px solid transparent',
                borderBottom: '140px solid #5A4635',
                opacity: 0.04,
                top: '20%',
                right: '30%',
                transform: 'rotate(45deg)'
              }}
            />
            {/* Geometric Shape - Square */}
            <div 
              className="absolute"
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: '#000000',
                opacity: 0.05,
                bottom: '15%',
                right: '15%',
                transform: 'rotate(25deg)',
                borderRadius: '20px'
              }}
            />
            {/* Wavy Line Pattern */}
            <svg 
              className="absolute"
              style={{
                top: '10%',
                left: '0',
                width: '100%',
                height: '100%',
                opacity: 0.03
              }}
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
            >
              <path
                d="M0,100 Q100,50 200,100 T400,100"
                stroke="#5A4635"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M0,120 Q100,170 200,120 T400,120"
                stroke="#000000"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center relative z-10">
            {/* Left Side - Text Content */}
            <div className="text-left">
              <h1 
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 800,
                  fontSize: '48px',
                  lineHeight: 1.1,
                  letterSpacing: '-1.2px',
                  color: '#000000',
                  marginBottom: '16px'
                }}
              >
                Welcome to BookMyCampus.
              </h1>
              <p 
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: '18px',
                  lineHeight: 1.65,
                  color: '#5A4635',
                  marginBottom: '12px'
                }}
              >
                Use this dashboard to book seminar halls, labs, and auditoriums for events and academic activities.
              </p>
              <p 
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: '18px',
                  lineHeight: 1.65,
                  color: '#5A4635'
                }}
              >
                Your upcoming bookings and the availability calendar are displayed below.
              </p>
            </div>
            
            {/* Right Side - Banner Image */}
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/welcome-banner.png" 
                alt="Banner illustration" 
                className="max-w-full h-auto rounded-2xl"
                style={{ maxHeight: '250px' }}
              />
            </div>
          </div>
        </div>

        {/* Two Column Layout: Left (Book Resource + Legend) and Right (My Bookings) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Book Resource Button */}
          <button
            onClick={() => {
              console.log('Book Resources button clicked');
              setShowBookingForm(true);
            }}
              className="w-full bg-yellow-400 text-black px-12 py-6 border-4 border-black font-black uppercase tracking-wide hover:bg-yellow-500 shadow-brutal text-xl"
          >
              + Book Resource
            </button>

        {/* Resource Legend */}
            <div className="bg-white border-4 border-black p-6 shadow-brutal">
          <h3 className="text-lg font-black text-black uppercase tracking-wide mb-4">Resource Legend</h3>
              <div className="space-y-3">
            <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-black"></div>
              <span className="text-lg font-bold text-black uppercase">Seminar Hall</span>
            </div>
            <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-black"></div>
              <span className="text-lg font-bold text-black uppercase">Auditorium</span>
            </div>
            <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-black"></div>
              <span className="text-lg font-bold text-black uppercase">Lab</span>
                </div>
            </div>
          </div>
        </div>

          {/* Right Column - My Bookings */}
        <div className="bg-white border-4 border-black p-8 shadow-brutal">
            <h2 className="text-2xl font-black text-black uppercase tracking-wide mb-6">My Bookings</h2>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search bookings…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold placeholder-gray-500 focus:outline-none focus:shadow-brutal"
                />
                <svg
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              </div>
            ) : (() => {
              // Filter bookings based on search query
              const filteredBookings = myBookings.filter(booking => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                return (
                  booking.title?.toLowerCase().includes(query) ||
                  booking.resource?.toLowerCase().includes(query) ||
                  booking.purpose?.toLowerCase().includes(query) ||
                  booking.status?.toLowerCase().includes(query)
                );
              });

              return filteredBookings.length === 0 ? (
                <p className="text-lg font-bold text-gray-600 uppercase">
                  {searchQuery ? 'No bookings found' : 'No bookings yet'}
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowSidePanel(true);
                      }}
                      className="border-4 border-black p-6 bg-white shadow-brutal cursor-pointer hover:shadow-brutal-lg transition-all hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="text-xl font-black text-black uppercase mb-2">{booking.title}</h3>
                          <div className="flex items-center space-x-6">
                            <p className="text-lg font-bold text-black">{booking.resource}</p>
                            <p className="text-sm font-bold text-gray-600 uppercase">
                              {new Date(booking.start).toLocaleDateString()} AT {new Date(booking.start).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        {(() => {
                          const displayStatus = getBookingDisplayStatus(booking);
                          return (
                            <span className={`px-3 py-1 rounded-lg border text-xs font-medium ml-4 ${
                              displayStatus === 'pending' ? 'bg-yellow-200 border-yellow-400 text-amber-900' :
                              displayStatus === 'conducted' ? 'bg-blue-200 border-blue-400 text-blue-900' :
                              'bg-yellow-200 border-yellow-400 text-amber-900'
                          }`}>
                              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                          </span>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Resource Calendar Section */}
        <div className="bg-white border-4 border-black p-6 shadow-brutal">
          <h2 className="text-2xl font-black text-black uppercase tracking-wide mb-6">Resource Calendar</h2>

              <FullCalendar
                key={view}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={view}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: ''
                }}
                events={formatCalendarEvents()}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height={view === 'timeGridWeek' ? '600px' : 'auto'}
                eventDisplay="block"
                dayMaxEvents={3}
                moreLinkClick="popover"
                nowIndicator={true}
                selectable={true}
                selectMirror={true}
                weekends={true}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5],
                  startTime: '08:00',
                  endTime: '18:00',
                }}
              />
        </div>
      </main>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ zIndex: 9999 }}
        >
          <div 
            className="bg-white border-4 border-black p-8 max-w-2xl w-full mx-4 shadow-brutal"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <BookingForm
              selectedDate={selectedDate}
              onClose={() => {
                console.log('Closing booking form');
                setShowBookingForm(false);
              }}
              onSuccess={() => {
                console.log('Booking form success');
                setShowBookingForm(false);
                loadCalendarEvents();
                loadMyBookings();
              }}
            />
          </div>
        </div>
      )}
      
      {/* Debug info */}
      {showBookingForm && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-2 z-50">
          Modal is open: {showBookingForm.toString()}
        </div>
      )}

      {/* Event Info Modal */}
      <EventInfoModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        selectedDate={modalDate}
        events={calendarEvents}
      />

      {/* Booking Side Panel */}
      <BookingSidePanel
        isOpen={showSidePanel}
        onClose={() => {
          setShowSidePanel(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onEdit={handleEditBooking}
        onCancel={handleCancelBooking}
      />
    </div>
  );
};

export default UserDashboard;
