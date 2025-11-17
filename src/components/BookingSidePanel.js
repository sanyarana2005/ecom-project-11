import React from 'react';
import { getBookingDisplayStatus } from '../utils/bookingUtils';

const BookingSidePanel = ({ isOpen, onClose, booking, onEdit, onCancel }) => {
  if (!isOpen || !booking) return null;

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gray-50 border-b-4 border-black p-6 flex justify-between items-center">
            <h2 className="text-xl font-black text-black uppercase tracking-wide">Booking Details</h2>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Event Name */}
              <div>
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                  Event Name
                </label>
                <h3 className="text-2xl font-black text-black uppercase">{booking.title}</h3>
              </div>

              {/* Resource with Status */}
              <div>
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                  Resource
                </label>
                <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-black">{booking.resource}</p>
                  {(() => {
                    const displayStatus = getBookingDisplayStatus(booking);
                    return (
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-medium ${
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

              {/* Date & Time */}
              <div>
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                  Date & Time
                </label>
                <p className="text-lg font-bold text-black">{formatDateTime(booking.start)}</p>
                {booking.end && (
                  <p className="text-sm font-bold text-gray-600 mt-1">
                    To: {formatDateTime(booking.end)}
                  </p>
                )}
              </div>

              {/* Description/Purpose */}
              <div>
                <label className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 block">
                  Description
                </label>
                <p className="text-base font-medium text-gray-800 leading-relaxed">
                  {booking.purpose || booking.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="border-t-4 border-black p-6 bg-gray-50 space-y-3">
            <button
              onClick={() => {
                onEdit(booking);
                onClose();
              }}
              className="w-full bg-blue-600 text-white px-6 py-3 border-4 border-black font-bold uppercase tracking-wide hover:bg-blue-700 shadow-brutal transition-all"
            >
              Edit Booking
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this booking?')) {
                  onCancel(booking.id);
                  onClose();
                }
              }}
              className="w-full bg-red-600 text-white px-6 py-3 border-4 border-black font-bold uppercase tracking-wide hover:bg-red-700 shadow-brutal transition-all"
            >
              Cancel Booking
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingSidePanel;

