/**
 * API client for crawler backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
export type ScrapingRequest = {
  template_id: string;
};

export type ScrapingResponse = {
  success: boolean;
  message: string;
  leads_queued: number;
  batch_id: string;
};

export type Schedule = {
  id: string;
  name: string;
  start_schedule: string;
  template_id: string;
  status: 'active' | 'inactive';
  last_run?: string | null;
  created_at: string;
};

export type ScheduleCreate = {
  name: string;
  start_schedule: string;
  template_id: string;
  status: 'active' | 'inactive';
};

export type ScheduleUpdate = {
  name: string;
  start_schedule: string;
  template_id: string;
  status: 'active' | 'inactive';
};

// Auth Types
export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
  };
};

export type User = {
  id: number; // Changed from string to number to match the payload
  email: string;
  name: string;
  role: string;
  created_at: string;
};

export type AuthMeResponse = {
  success: boolean;
  user: User;
};

// Stats Types
export type DashboardStats = {
  success: boolean;
  data: {
    counts: {
      leads_count: number;
      templates_count: number;
      companies_count: number;
      schedules_count: number;
    };
    leads_by_status: {
      connected: number;
      pending: number;
      not_connected: number;
    };
    recent_leads: Array<{ date: string; count: number }>;
  };
};

export type CountResponse = {
  success: boolean;
  count: number;
};

// Lead Types
export type Lead = {
  id: string;
  name: string;
  connection_status: string;
  score: number;
  processed_at: string;
  profile_url: string;
  note_sent?: string;
  sent_at?: string;
  template_id: string;
  profile_data?: any;
  scoring_data?: any;
};

// Template Types
export type Template = {
  id: string;
  name: string;
  company_id: string;
  job_title?: string;
  url?: string;
  note?: string;
  job_description?: string;
  requirements?: {
    position: string;
    requirements: Array<{
      id: string;
      type: string;
      label: string;
      value: string | number;
    }>;
  };
  external_source?: string;
  created_at: string;
};

export type TemplateUpdate = {
  name?: string;
  requirements?: any;
  note?: string;
};

// Company Types
export type Company = {
  id: string;
  name: string;
  code: string;
  domain?: string;
  created_at: string;
};

export type CompanyCreate = {
  name: string;
  code?: string;
  domain?: string;
};

// Requirement Types
export type Requirement = {
  id: string;
  label: string;
  type: string;
  value?: any;
};

class CrawlerAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      
      // Fallback: try to get from cookie if localStorage is empty
      if (!this.token) {
        const cookies = document.cookie.split(';');
        const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
        if (authCookie) {
          this.token = authCookie.split('=')[1];
          // Save back to localStorage for consistency
          localStorage.setItem('auth_token', this.token);
        }
      }
      
      console.log('CrawlerAPI Constructor - Token loaded:', !!this.token);
      if (this.token) {
        console.log('Token preview:', this.token.substring(0, 20) + '...');
      }
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    console.log('Getting auth headers, current token:', this.token);
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      console.log('Added Authorization header:', headers['Authorization']);
    } else {
      console.log('No token available for auth headers');
    }
    
    return headers;
  }

  setToken(token: string) {
    console.log('Setting token:', token);
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      console.log('Token saved to localStorage:', localStorage.getItem('auth_token'));
      
      // Set cookie with proper format
      const expires = new Date();
      expires.setTime(expires.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
      const cookieString = `auth_token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      console.log('Setting cookie:', cookieString);
      document.cookie = cookieString;
      
      // Verify cookie was set
      console.log('All cookies after setting:', document.cookie);
      console.log('Current instance token:', this.token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Clear cookie properly
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    }
  }

  getCurrentToken(): string | null {
    return this.token;
  }

  reloadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      console.log('Token reloaded from localStorage:', this.token);
    }
  }

  debugTokenState(): void {
    console.log('=== TOKEN DEBUG ===');
    console.log('Instance token:', this.token);
    if (typeof window !== 'undefined') {
      console.log('localStorage token:', localStorage.getItem('auth_token'));
      console.log('Document cookies:', document.cookie);
    }
    console.log('==================');
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
      });

      if (!response.ok) {
        // Handle expired/invalid token
        if (response.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please login again.');
        }

        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error or unknown error occurred');
    }
  }

  // ===== CORE SYSTEM =====
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  async getQueueStatus() {
    return this.request<any>('/api/schedules/queue/status');
  }

  // ===== AUTHENTICATION =====
  async login(data: LoginRequest) {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    console.log('Login API response:', response);
    console.log('About to set token:', response.token);
    
    // Store token after successful login
    this.setToken(response.token);
    
    console.log('Token set, current token:', this.token);
    return response;
  }

  async getMe() {
    const response = await this.request<AuthMeResponse>('/api/auth/me');
    return response.user; // Extract user from the response
  }

  async logout() {
    const response = await this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    });
    
    // Clear token after logout
    this.clearToken();
    return response;
  }

  // ===== DASHBOARD STATS =====
  async getDashboardStats() {
    return this.request<DashboardStats>('/api/stats');
  }

  async getLeadsCount() {
    return this.request<CountResponse>('/api/stats/leads');
  }

  async getTemplatesCount() {
    return this.request<CountResponse>('/api/stats/templates');
  }

  async getCompaniesCount() {
    return this.request<CountResponse>('/api/stats/companies');
  }

  // ===== LEADS MANAGEMENT =====
  async getLeads(params?: {
    template_id?: string;
    search?: string;
    sort_by?: 'processed_at' | 'score';
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.template_id) searchParams.set('template_id', params.template_id);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/leads?${queryString}` : '/api/leads';
    
    const response = await this.request<{
      success: boolean;
      count: number;
      leads: {
        leads: Lead[];
        pagination: {
          total_count: number;
          total_pages: number;
          current_page: number;
          per_page: number;
          has_next: boolean;
          has_prev: boolean;
        };
      };
    }>(endpoint);

    // Transform the nested response to the expected flat structure
    return {
      leads: response.leads.leads,
      total: response.leads.pagination.total_count,
      page: response.leads.pagination.current_page,
      limit: response.leads.pagination.per_page,
      total_pages: response.leads.pagination.total_pages,
    };
  }

  async exportLeads(templateId: string, format: 'csv' | 'json') {
    return this.request<{ download_url: string }>(`/api/leads/export?template_id=${templateId}&format=${format}`);
  }

  // ===== COMPANIES MANAGEMENT =====
  async getCompanies(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort?: 'name' | 'domain' | 'created_at';
    order?: 'asc' | 'desc';
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/companies?${queryString}` : '/api/companies';
    
const response = await this.request<{
  success: boolean;
  count: number;
  companies: {          // <-- ini harus object, bukan Company[]
    companies: Company[];
    pagination: {
      total_count: number;
      total_pages: number;
      current_page: number;
      per_page: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}>(endpoint);


    // Return the response as-is since it matches the expected structure
    return response;
  }

  async createCompany(data: CompanyCreate) {
    return this.request<Company>('/api/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== TEMPLATES MANAGEMENT =====
  async getTemplate(templateId: string) {
    const response = await this.request<{
      success: boolean;
      template: Template;
    }>(`/api/templates/${templateId}`);
    
    // Return the nested template object
    return response.template;
  }

  async updateTemplate(templateId: string, data: TemplateUpdate) {
    return this.request<Template>(`/api/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(templateId: string) {
    return this.request<{ message: string }>(`/api/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // ===== REQUIREMENTS TEMPLATES =====
  async getTemplates() {
    return this.request<{ success: boolean; templates: Template[] }>('/api/requirements/templates');
  }

  async getCompanyTemplates(companyId: string) {
    const response = await this.request<{
      success: boolean;
      company_id: string;
      count: number;
      templates: Template[];
    }>(`/api/companies/${companyId}/templates`);
    return response.templates;
  }

  // ===== SCHEDULER MANAGEMENT =====
  async getSchedules() {
    return this.request<{ schedules: Schedule[] }>('/api/schedules');
  }

  async getSchedule(scheduleId: string) {
    return this.request<Schedule>(`/api/schedules/${scheduleId}`);
  }

  async createSchedule(data: ScheduleCreate) {
    return this.request<Schedule>('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSchedule(scheduleId: string, data: ScheduleUpdate) {
    return this.request<Schedule>(`/api/schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSchedule(scheduleId: string) {
    return this.request<{ message: string }>(`/api/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
  }

  async toggleSchedule(scheduleId: string) {
    return this.request<Schedule>(`/api/schedules/${scheduleId}/toggle`, {
      method: 'PATCH',
    });
  }

  async executeScheduleManually(scheduleId: string) {
    return this.request<any>(`/api/schedules/${scheduleId}/execute`, {
      method: 'POST',
    });
  }

  // ===== SCRAPING OPERATIONS =====
  async startScraping(data: ScrapingRequest) {
    return this.request<ScrapingResponse>('/api/scraping/start', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async analyzeLead(templateId: string) {
    return this.request<{
      total: number;
      complete: number;
      needProcessing: number;
      completionRate: number;
    }>(`/api/scraping/analyze/${templateId}`);
  }

  async getCrawlerStatus() {
    return this.request<{
      is_running: boolean;
      queue_size: number;
      template_id?: string;
      template_name?: string;
      processed_count: number;
    }>('/api/scraping/status');
  }

  async getCrawlSession() {
    return this.request<{
      is_active: boolean;
      source: 'manual' | 'scheduled' | null;
      schedule_id?: string;
      schedule_name?: string;
      template_id?: string;
      template_name?: string;
      started_at?: string;
      leads_queued: number;
      current_queue_size: number;
    }>('/api/scraping/session');
  }

  async stopScraping() {
    return this.request<{
      success: boolean;
      message: string;
      jobs_removed: number;
    }>('/api/scraping/stop', {
      method: 'POST',
    });
  }

  // ===== OUTREACH OPERATIONS =====
  async sendOutreach(data: any) {
    return this.request<any>('/api/outreach/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const crawlerAPI = new CrawlerAPI();
