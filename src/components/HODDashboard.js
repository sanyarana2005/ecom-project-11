import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { getBookingDisplayStatus } from '../utils/bookingUtils';

const HODDashboard = () => {
  const { user, logout } = useAuth();
  const { pendingRequests, approveBooking, rejectBooking } = useBooking();
  const [loading, setLoading] = useState({});

  const handleLogout = () => {
    logout();
  };

  const handleApprove = async (requestId) => {
    setLoading(prev => ({ ...prev, [requestId]: 'approving' }));
    try {
      await approveBooking(requestId);
    } catch (error) {
      console.error('Failed to approve booking:', error);
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleReject = async (requestId) => {
    setLoading(prev => ({ ...prev, [requestId]: 'rejecting' }));
    try {
      await rejectBooking(requestId);
    } catch (error) {
      console.error('Failed to reject booking:', error);
    } finally {
      setLoading(prev => ({ ...prev, [requestId]: null }));
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

  const getResourceColor = (resource) => {
    const colors = {
      'Seminar Hall': 'bg-resource-seminar text-brutal-white',
      'Auditorium': 'bg-resource-auditorium text-brutal-white',
      'Lab': 'bg-resource-lab text-brutal-white'
    };
    return colors[resource] || 'bg-brutal-black text-brutal-white';
  };

  return (
    <div className="min-h-screen bg-brutal-white">
      {/* Header */}
      <header className="bg-brutal-white border-b-4 border-brutal-black shadow-brutal-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-brutal-black border-4 border-brutal-black shadow-brutal-sm flex items-center justify-center mr-4">
                <svg className="h-8 w-8 text-brutal-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-brutal-black uppercase tracking-wide">
                HOD Dashboard - Resource Booking Approval
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-sm font-bold text-brutal-black uppercase">
                Welcome, <span className="text-brutal-yellow">{user.name.toUpperCase()}</span>
              </div>
              <button
                onClick={handleLogout}
                className="brutalist-button text-sm px-4 py-2"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="brutalist-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-brutal-yellow border-4 border-brutal-black shadow-brutal-sm flex items-center justify-center">
                  <svg className="w-8 h-8 text-brutal-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-brutal-black uppercase tracking-wide">Pending Requests</p>
                <p className="text-3xl font-black text-brutal-black">{pendingRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="brutalist-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-brutal-orange border-4 border-brutal-black shadow-brutal-sm flex items-center justify-center">
                  <svg className="w-8 h-8 text-brutal-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-brutal-black uppercase tracking-wide">Total Resources</p>
                <p className="text-3xl font-black text-brutal-black">3</p>
              </div>
            </div>
          </div>

          <div className="brutalist-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-brutal-purple border-4 border-brutal-black shadow-brutal-sm flex items-center justify-center">
                  <svg className="w-8 h-8 text-brutal-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-bold text-brutal-black uppercase tracking-wide">Approved Today</p>
                <p className="text-3xl font-black text-brutal-black">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="brutalist-card">
          <div className="px-8 py-6 border-b-4 border-brutal-black">
            <h2 className="text-2xl font-black text-brutal-black uppercase tracking-wide">Pending Booking Requests</h2>
            <p className="brutalist-text mt-2">
              Review and approve or reject booking requests from your department
            </p>
          </div>

          <div className="p-8">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 bg-brutal-yellow border-4 border-brutal-black shadow-brutal flex items-center justify-center mb-6">
                  <svg className="h-12 w-12 text-brutal-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-brutal-black uppercase tracking-wide">No Pending Requests</h3>
                <p className="brutalist-text mt-2">
                  All booking requests have been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="bg-brutal-white border-4 border-brutal-black p-8 shadow-brutal-sm hover:shadow-brutal transition-all duration-150">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <h3 className="text-2xl font-black text-brutal-black uppercase tracking-wide">{request.title}</h3>
                          <span className={`inline-flex items-center px-4 py-2 border-4 border-brutal-black text-sm font-bold uppercase tracking-wide ${getResourceColor(request.resource)}`}>
                            {request.resource}
                          </span>
                          {(() => {
                            const displayStatus = getBookingDisplayStatus(request);
                            if (displayStatus === 'conducted') {
                              return (
                                <span className="inline-flex items-center px-4 py-2 border-4 border-brutal-black text-sm font-bold uppercase tracking-wide bg-blue-500 text-white">
                                  CONDUCTED
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg text-brutal-black mb-6">
                          <div>
                            <span className="font-bold uppercase tracking-wide">Requester:</span> {request.requester}
                          </div>
                          <div>
                            <span className="font-bold uppercase tracking-wide">Date & Time:</span> {formatDateTime(request.start)} - {formatDateTime(request.end)}
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-bold uppercase tracking-wide">Purpose:</span> {request.purpose}
                          </div>
                        </div>

                        <div className="text-sm font-bold text-brutal-black uppercase tracking-wide">
                          Submitted: {formatDateTime(request.submittedAt)}
                        </div>
                      </div>

                      <div className="flex space-x-4 ml-6">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={loading[request.id]}
                          className="brutalist-button-accent text-lg px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading[request.id] === 'approving' ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brutal-black mr-2"></div>
                              APPROVING...
                            </div>
                          ) : (
                            <>
                              <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                              APPROVE
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={loading[request.id]}
                          className="brutalist-button text-lg px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading[request.id] === 'rejecting' ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brutal-white mr-2"></div>
                              REJECTING...
                            </div>
                          ) : (
                            <>
                              <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              REJECT
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-brutal-yellow border-4 border-brutal-black p-8 shadow-brutal">
          <h3 className="text-2xl font-black text-brutal-black mb-4 uppercase tracking-wide">HOD Approval Guidelines</h3>
          <ul className="list-disc list-inside space-y-3 text-brutal-black font-bold text-lg">
            <li>Review each booking request carefully</li>
            <li>Check for conflicts with existing bookings</li>
            <li>Ensure the purpose aligns with college policies</li>
            <li>Approved bookings will automatically appear on the public calendar</li>
            <li>Rejected requests will be notified to the requester</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default HODDashboard;
