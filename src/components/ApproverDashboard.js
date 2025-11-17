import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import EventInfoModal from './EventInfoModal';
import { getBookingDisplayStatus } from '../utils/bookingUtils';

const ApproverDashboard = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { 
    calendarEvents, 
    pendingRequests, 
    loading, 
    loadCalendarEvents, 
    loadPendingRequests
  } = useBooking();
  
  const [view] = useState('dayGridMonth');
  const [showEventModal, setShowEventModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);

  useEffect(() => {
    loadCalendarEvents();
    loadPendingRequests(user?.department_id);
  }, [loadCalendarEvents, loadPendingRequests, user?.department_id]);

  const handleLogout = () => {
    logout();
  };

  const handleDateClick = (arg) => {
    try {
      const clickedDateTime = arg?.date;
      if (!clickedDateTime) return;
      
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
        
        // Create time string
        const timeStr = `${startTime} - ${endTime}`;
        
        // Calculate duration
        const durationMs = endDate - startDate;
        const durationHours = Math.round(durationMs / (1000 * 60 * 60));
        const durationText = durationHours === 1 ? '1 hour' : `${durationHours} hours`;
        
        // Gantt chart style - light colors with dark text
        let backgroundColor, textColor, resourceIcon;
        
        if (event.type === 'timetable') {
          backgroundColor = '#fce7f3'; // Light pink
          textColor = '#9f1239';
          resourceIcon = 'train';
        } else if (event.status === 'pending') {
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
        } else if (event.status === 'conducted') {
          // Show resource colors for conducted events - slightly more opaque
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
        } else {
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
        }
        
        // Format title for Gantt chart style: "Time • Title • Duration"
        const eventTitle = event.title || 'Event';
        const ganttTitle = `${timeStr} • ${eventTitle} • ${durationText}`;
        
        return {
        id: event.id,
          title: ganttTitle,
        start: event.start,
        end: event.end,
          backgroundColor: backgroundColor,
          borderColor: backgroundColor, // Match border to background
          textColor: textColor,
          classNames: [],
          extendedProps: {
            ...event,
            resourceIcon
          }
        };
      });
    } catch (error) {
      console.error('Error formatting calendar events:', error);
      return [];
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <div className="px-4 py-2">
                <p className="text-lg font-black text-black uppercase tracking-wide">
                  Hello <span className="text-purple-600">HOD</span>
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
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-4 border-black p-6 shadow-brutal">
            <h3 className="text-lg font-black text-black uppercase tracking-wide mb-4">UPCOMING EVENTS</h3>
            <div className="text-4xl font-black text-purple-600">{pendingRequests?.length || 0}</div>
          </div>
          <div className="bg-white border-4 border-black p-6 shadow-brutal">
            <h3 className="text-lg font-black text-black uppercase tracking-wide mb-4">TOTAL RESOURCES</h3>
            <div className="text-4xl font-black text-blue-500">3</div>
          </div>
          <div className="bg-white border-4 border-black p-6 shadow-brutal">
            <h3 className="text-lg font-black text-black uppercase tracking-wide mb-4">DEPARTMENT</h3>
            <div className="text-lg font-bold text-black">{user?.department || 'N/A'}</div>
          </div>
        </div>

        {/* Booking Events Section - Informational Only */}
        <div className="mb-8">
          <div className="bg-white border-4 border-black p-5 shadow-brutal">
            <h2 className="text-xl font-black text-black uppercase tracking-wide mb-3">UPCOMING BOOKING EVENTS</h2>
            <p className="text-sm font-bold text-gray-700 mb-5">
              Overview of all booking requests and scheduled events in your department
            </p>
              
              {loading ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              ) : !pendingRequests || pendingRequests.length === 0 ? (
                <div className="text-center py-6">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    There are currently no booking events scheduled.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {(pendingRequests || []).map((request) => (
                    <div key={request.id} className="border-4 border-black p-4 bg-white shadow-brutal">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-black text-black uppercase">{request.title}</h3>
                            <span className={`inline-flex items-center px-3 py-1 border-2 border-black text-xs font-bold uppercase ${
                              request.resource === 'Seminar Hall' ? 'bg-blue-500 text-white' :
                              request.resource === 'Auditorium' ? 'bg-red-500 text-white' :
                              'bg-green-500 text-white'
                            }`}>
                              {request.resource}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-bold text-black mb-3">
                            <div>
                              <span className="uppercase">Requester:</span> {request.requesterName}
                            </div>
                            <div>
                              <span className="uppercase">Date & Time:</span> {formatDateTime(request.start)}
                            </div>
                            <div className="md:col-span-2">
                              <span className="uppercase">Purpose:</span> {request.purpose}
                            </div>
                          </div>

                          <div className="text-xs font-bold text-gray-600 uppercase mb-2">
                            Submitted: {formatDateTime(request.createdAt)}
                          </div>
                          <div>
                            {(() => {
                              const displayStatus = getBookingDisplayStatus(request);
                              return (
                            <span className={`inline-flex items-center px-3 py-1 border-2 border-black text-xs font-bold uppercase ${
                                  displayStatus === 'pending' ? 'bg-yellow-500 text-black' :
                                  displayStatus === 'conducted' ? 'bg-blue-500 text-white' :
                                  'bg-yellow-500 text-black'
                            }`}>
                                  Status: {displayStatus.toUpperCase()}
                            </span>
                              );
                            })()}
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Resource Calendar</h2>
            </div>

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
              selectable={true}
              selectMirror={true}
              height={view === 'timeGridWeek' ? '600px' : 'auto'}
              eventDisplay="block"
              dayMaxEvents={2}
              moreLinkClick="popover"
              nowIndicator={true}
              weekends={true}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '08:00',
                endTime: '18:00',
              }}
            />
          </div>
        </div>
      </main>

      {/* Event Info Modal */}
      <EventInfoModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        selectedDate={modalDate}
        events={calendarEvents}
      />
    </div>
  );
};

export default ApproverDashboard;