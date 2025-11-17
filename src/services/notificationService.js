// Notification Service for Toast Messages
class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  }

  // Add notification
  addNotification(notification) {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: notification.type || 'info', // success, error, warning, info
      title: notification.title || '',
      message: notification.message || '',
      duration: notification.duration || 5000,
      ...notification
    };

    this.notifications.push(newNotification);
    this.notifyListeners();

    // Auto remove after duration
    setTimeout(() => {
      this.removeNotification(id);
    }, newNotification.duration);

    return id;
  }

  // Remove notification
  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Subscribe to notifications
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Convenience methods
  success(title, message, duration = 5000) {
    return this.addNotification({ type: 'success', title, message, duration });
  }

  error(title, message, duration = 7000) {
    return this.addNotification({ type: 'error', title, message, duration });
  }

  warning(title, message, duration = 6000) {
    return this.addNotification({ type: 'warning', title, message, duration });
  }

  info(title, message, duration = 5000) {
    return this.addNotification({ type: 'info', title, message, duration });
  }

  // Booking specific notifications
  bookingConfirmed(resource, date, time) {
    return this.success(
      '✅ Booking Confirmed',
      `${resource} booked for ${date} at ${time}`,
      6000
    );
  }

  bookingPending(resource, date, time) {
    return this.success(
      '✅ Slot Booked',
      `${resource} booked for ${date} at ${time}`,
      6000
    );
  }

  bookingRejected(reason = 'No reason provided') {
    return this.error(
      '❌ Request Rejected',
      `Your booking request was rejected. ${reason}`,
      7000
    );
  }

  bookingConflict(resource, time) {
    return this.error(
      '❌ Booking Conflict',
      `${resource} is already booked at ${time}`,
      6000
    );
  }

  timetableConflict(resource, time) {
    return this.error(
      '❌ Resource Occupied',
      `${resource} is occupied by class at ${time}`,
      6000
    );
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;



