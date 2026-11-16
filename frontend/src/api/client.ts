import {
  User, FoodListing, Reservation, DeliveryTask, InAppNotification,
  Complaint, HotelAnalytics, PlatformAnalytics, Business, BusinessStaff
} from "../types";

const API_BASE = "/api/v1";

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("annapath_token");
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("annapath_token", token);
    } else {
      localStorage.removeItem("annapath_token");
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const data = await this.request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  // Food Listings
  async getListings(params: Record<string, any> = {}): Promise<FoodListing[]> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.append(k, String(v));
      }
    });
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.request<FoodListing[]>(`/food-listings/${qs}`);
  }

  async createListing(data: any): Promise<FoodListing> {
    return this.request<FoodListing>("/food-listings/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelListing(id: string): Promise<any> {
    return this.request(`/food-listings/${id}/cancel`, { method: "POST" });
  }

  // Reservations
  async createReservation(data: {
    listing_id: string;
    quantity: number;
    distribution_method: string;
    delivery_address?: any;
  }): Promise<Reservation> {
    return this.request<Reservation>("/reservations/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMyReservations(): Promise<Reservation[]> {
    return this.request<Reservation[]>("/reservations/me");
  }

  async cancelReservation(id: string): Promise<Reservation> {
    return this.request<Reservation>(`/reservations/${id}/cancel`, { method: "POST" });
  }

  async verifyPickupOTP(reservationId: string, otp: string): Promise<Reservation> {
    return this.request<Reservation>(`/reservations/${reservationId}/verify-pickup`, {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  }

  async verifyDeliveryOTP(reservationId: string, otp: string): Promise<Reservation> {
    return this.request<Reservation>(`/reservations/${reservationId}/verify-delivery`, {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  }

  // Volunteer Tasks
  async getVolunteerTasks(): Promise<DeliveryTask[]> {
    return this.request<DeliveryTask[]>("/volunteers/tasks");
  }

  async acceptTask(taskId: string): Promise<any> {
    return this.request(`/volunteers/tasks/${taskId}/accept`, { method: "POST" });
  }

  async declineTask(taskId: string): Promise<any> {
    return this.request(`/volunteers/tasks/${taskId}/decline`, { method: "POST" });
  }

  async reachedHotel(taskId: string): Promise<any> {
    return this.request(`/volunteers/tasks/${taskId}/reached-hotel`, { method: "POST" });
  }

  async confirmVolunteerPickup(taskId: string): Promise<any> {
    return this.request(`/volunteers/tasks/${taskId}/pickup`, { method: "POST" });
  }

  async getVolunteerAnalytics(): Promise<any> {
    return this.request("/volunteers/me/analytics");
  }

  // Business & Analytics
  async getMyBusinesses(): Promise<Business[]> {
    return this.request<Business[]>("/businesses/me");
  }

  async getBusinessAnalytics(businessId: string): Promise<HotelAnalytics> {
    return this.request<HotelAnalytics>(`/businesses/${businessId}/analytics`);
  }

  async getBusinessStaff(businessId: string): Promise<BusinessStaff[]> {
    return this.request<BusinessStaff[]>(`/businesses/${businessId}/staff`);
  }

  async addStaff(businessId: string, email: string, permission_level: string): Promise<BusinessStaff> {
    return this.request<BusinessStaff>(`/businesses/${businessId}/staff`, {
      method: "POST",
      body: JSON.stringify({ email, permission_level }),
    });
  }

  // Admin & Platform
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    return this.request<PlatformAnalytics>("/admin/analytics");
  }

  async getAdminBusinesses(): Promise<Business[]> {
    return this.request<Business[]>("/admin/businesses");
  }

  async addAdminBusiness(data: any): Promise<Business> {
    return this.request<Business>("/admin/businesses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyBusiness(businessId: string, action: string): Promise<Business> {
    return this.request<Business>(`/admin/businesses/${businessId}/verify`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  }

  async getAdminVolunteers(): Promise<User[]> {
    return this.request<User[]>("/admin/volunteers");
  }

  async addAdminVolunteer(data: any): Promise<User> {
    return this.request<User>("/admin/volunteers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyVolunteer(userId: string, action: string): Promise<User> {
    return this.request<User>(`/admin/volunteers/${userId}/verify`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
  }

  async getComplaints(): Promise<Complaint[]> {
    return this.request<Complaint[]>("/admin/complaints");
  }

  async fileComplaint(reservationId: string, type: string, description: string): Promise<Complaint> {
    return this.request<Complaint>("/admin/complaints", {
      method: "POST",
      body: JSON.stringify({ reservation_id: reservationId, complaint_type: type, description }),
    });
  }

  async resolveComplaint(complaintId: string, status: string, notes: string): Promise<Complaint> {
    return this.request<Complaint>(`/admin/complaints/${complaintId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, resolution_notes: notes }),
    });
  }

  async getAuditLogs(): Promise<any[]> {
    return this.request<any[]>("/admin/audit-logs");
  }

  // Notifications
  async getNotifications(): Promise<InAppNotification[]> {
    return this.request<InAppNotification[]>("/notifications/");
  }

  async markNotificationRead(id: string): Promise<any> {
    return this.request(`/notifications/${id}/read`, { method: "POST" });
  }
}

export const api = new ApiClient();
