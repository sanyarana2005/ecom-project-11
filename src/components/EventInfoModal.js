import React from 'react';
import { getBookingDisplayStatus } from '../utils/bookingUtils';

const EventInfoModal = ({ isOpen, onClose, selectedDate, events }) => {
  if (!isOpen || !selectedDate) return null;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const dayEvents = events.filter(event => {
    if (!event.start) return false;
    const eventDate = new Date(event.start);
    const selected = new Date(selectedDate);
    return (
      eventDate.getFullYear() === selected.getFullYear() &&
      eventDate.getMonth() === selected.getMonth() &&
      eventDate.getDate() === selected.getDate()
    );
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Events for {formatDate(selectedDate)}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {dayEvents.length === 0 ? 'No events scheduled' : `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''} scheduled`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
              <p className="mt-1 text-sm text-gray-500">There are no events scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayEvents.map((event, index) => {
                const startTime = formatTime(event.start);
                const endTime = event.end ? formatTime(event.end) : '';
                const eventType = event.type || (event.status === 'pending' ? 'pending' : 'approved');
                const displayStatus = getBookingDisplayStatus(event);
                
                let statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                let statusText = 'Scheduled';
                
                if (eventType === 'timetable') {
                  statusColor = 'bg-gray-100 text-gray-800 border-gray-200';
                  statusText = 'Class Schedule';
                } else if (displayStatus === 'pending') {
                  statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  statusText = 'Pending';
                } else if (displayStatus === 'conducted') {
                  statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                  statusText = 'Conducted';
                } else {
                  statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  statusText = 'Pending';
                }

                return (
                  <div
                    key={event.id || index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {event.title || 'Untitled Event'}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{startTime}{endTime ? ` - ${endTime}` : ''}</span>
                          </div>
                          {event.resource && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>{event.resource}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                    
                    {event.purpose && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Purpose:</p>
                        <p className="text-sm text-gray-600">{event.purpose}</p>
                      </div>
                    )}
                    
                    {event.requesterName && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Requester:</span> {event.requesterName}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventInfoModal;

