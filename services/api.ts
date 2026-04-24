
/**
 * API Service for Avagama AI
 * Integrated with Render backend at https://avagama-backend-ckm9.onrender.com/api
 */

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://3.109.133.35:5000'}/api`;
// const BASE_URL = "https://avagama-backend-ckm9.onrender.com/api";
const getHeaders = (isJson = true) => {
  const token = sessionStorage.getItem('token');
  return {
    ...(isJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(data.message || data.error || `Server Error: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
};

export const apiService = {
  auth: {
    login: async (credentials: any) => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(credentials),
      });
      return handleResponse(response);
    },
    register: async (userData: any) => {
      const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      return handleResponse(response);
    },
    forgotPassword: async (email: string) => {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });
      return handleResponse(response);
    },
    resetPassword: async (token: string, password: any) => {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ token, password }),
      });
      return handleResponse(response);
    },
    getMe: async () => {
      const response = await fetch(`${BASE_URL}/me`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getProfile: async () => {
      const response = await fetch(`${BASE_URL}/auth/profile`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getCredits: async () => {
      const response = await fetch(`${BASE_URL}/auth/credits`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  evaluations: {
    create: async (discoveryData: any) => {
      const response = await fetch(`${BASE_URL}/evaluations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(discoveryData),
      });
      return handleResponse(response);
    },
    uploadSOP: async (id: string, file: File) => {
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      // Key must be 'file' as per requirement
      formData.append('file', file);
      
      const response = await fetch(`${BASE_URL}/evaluations/${id}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData,
      });
      return handleResponse(response);
    },
    updateOperations: async (id: string, opsData: any) => {
      const response = await fetch(`${BASE_URL}/evaluations/${id}/operations`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(opsData),
      });
      return handleResponse(response);
    },
    updateAIConfig: async (id: string, configData: any) => {
      const response = await fetch(`${BASE_URL}/evaluations/${id}/ai-config`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(configData),
      });
      return handleResponse(response);
    },
    runAgent: async (id: string) => {
      const response = await fetch(`${BASE_URL}/evaluations/${id}/run`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    list: async () => {
      const response = await fetch(`${BASE_URL}/evaluations`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    get: async (id: string) => {
      const response = await fetch(`${BASE_URL}/evaluations/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/evaluations/delete/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getDashboard: async () => {
      const response = await fetch(`${BASE_URL}/dashboard`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    export: async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/export/evaluations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream'
        },
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body');
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || 'Export failed');
        } catch (e: any) {
          throw new Error(`Server error (${response.status})`);
        }
      }
      return response.blob();
    },
    toggleShortlist: async (id: string) => {
      const response = await fetch(`${BASE_URL}/evaluations/${id}/shortlist`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getShortlisted: async () => {
      const response = await fetch(`${BASE_URL}/evaluations/shortlisted`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  useCases: {
    generateCompany: async (company: string) => {
      const response = await fetch(`${BASE_URL}/usecases/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ company }),
      });
      return handleResponse(response);
    },
    listCompany: async () => {
      const response = await fetch(`${BASE_URL}/usecases`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getCompany: async (id: string) => {
      const response = await fetch(`${BASE_URL}/usecases/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    generateDomain: async (payload: { domain: string, user_role: string, objective: string }) => {
      const response = await fetch(`${BASE_URL}/usecases-domain/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    listDomain: async () => {
      const response = await fetch(`${BASE_URL}/usecases-domain`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getDomain: async (id: string) => {
      const response = await fetch(`${BASE_URL}/usecases-domain/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteCompany: async (id: string) => {
      const response = await fetch(`${BASE_URL}/usecases/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteDomain: async (id: string) => {
      const response = await fetch(`${BASE_URL}/usecases-domain/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    exportCompany: async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/export/company`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream'
        },
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body');
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || 'Export failed');
        } catch (e: any) {
          throw new Error(`Server error (${response.status})`);
        }
      }
      return response.blob();
    },
    exportDomain: async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/export/domain`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream'
        },
      });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body');
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || 'Export failed');
        } catch (e: any) {
          throw new Error(`Server error (${response.status})`);
        }
      }
      return response.blob();
    }
  },

  ai: {
    askCortex: async (question: string) => {
      const response = await fetch(`${BASE_URL}/ai/ask-cortex`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question }),
      });
      return handleResponse(response);
    },
    getUsecaseChat: async (sourceType: string, documentId: string, usecaseId: string) => {
      const response = await fetch(`${BASE_URL}/ai/usecase-chat/${sourceType}/${documentId}/${usecaseId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getUsecaseDetails: async (sourceType: string, documentId: string, usecaseId: string) => {
      const response = await fetch(`${BASE_URL}/ai/usecase-details/${sourceType}/${documentId}/${usecaseId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    askUsecase: async (payload: { question: string, sourceType: string, documentId: string, usecaseId: string }) => {
      const response = await fetch(`${BASE_URL}/ai/ask-usecase`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    }
  },

  system: {
    onboardEnterprise: async (data: any) => {
      const response = await fetch(`${BASE_URL}/system/onboard`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getDashboard: async () => {
      const response = await fetch(`${BASE_URL}/system/dashboard`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getUsers: async () => {
      const response = await fetch(`${BASE_URL}/system/users`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getCreditRequests: async () => {
      const response = await fetch(`${BASE_URL}/system/credit-requests`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    assignPlan: async (orgId: string, data: { plan: string; validityDays: number }) => {
      const response = await fetch(`${BASE_URL}/system/organizations/${orgId}/assign-plan`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    assignCredits: async (orgId: string, data: { amount: number }) => {
      const response = await fetch(`${BASE_URL}/system/organizations/${orgId}/assign-credits`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    toggleOrganizationStatus: async (orgId: string) => {
      const response = await fetch(`${BASE_URL}/system/organizations/${orgId}/toggle-status`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteOrganization: async (orgId: string) => {
      const response = await fetch(`${BASE_URL}/system/organizations/${orgId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    approveUser: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/system/users/${userId}/approve`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    toggleUserStatus: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/system/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteUser: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/system/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    approveCreditRequest: async (requestId: string) => {
      const response = await fetch(`${BASE_URL}/system/credit-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    rejectCreditRequest: async (requestId: string, data: { reason: string }) => {
      const response = await fetch(`${BASE_URL}/system/credit-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getCreditRequestsHistory: async () => {
      const response = await fetch(`${BASE_URL}/system/credit-requests/history`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  documents: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${BASE_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
        body: formData,
      });
      return handleResponse(response);
    },
    ask: async (documentId: string, question: string) => {
      const response = await fetch(`${BASE_URL}/documents/ask`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ documentId, question }),
      });
      return handleResponse(response);
    },
    getChatHistory: async (documentId: string) => {
      const response = await fetch(`${BASE_URL}/documents/chat/${documentId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getMessage: async (documentId: string, messageId: string) => {
      const response = await fetch(`${BASE_URL}/documents/chat/${documentId}/message/${messageId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteMessage: async (documentId: string, messageId: string) => {
      const response = await fetch(`${BASE_URL}/documents/chat/${documentId}/message/${messageId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  org: {
    onboardUser: async (data: any) => {
      const response = await fetch(`${BASE_URL}/org/onboard`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getDashboard: async () => {
      const response = await fetch(`${BASE_URL}/org/dashboard`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getDepartments: async () => {
      const response = await fetch(`${BASE_URL}/org/departments`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    createDepartment: async (data: { name: string }) => {
      const response = await fetch(`${BASE_URL}/org/departments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    deleteDepartment: async (deptId: string) => {
      const response = await fetch(`${BASE_URL}/org/departments/${deptId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getUsers: async () => {
      const response = await fetch(`${BASE_URL}/org/users`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    approveUser: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/org/users/${userId}/approve`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    removeUser: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/org/users/${userId}/remove`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    moveUser: async (userId: string, data: { departmentId: string }) => {
      const response = await fetch(`${BASE_URL}/org/users/${userId}/move`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    promoteUser: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/org/users/${userId}/promote`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    demoteUser: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/org/users/${userId}/demote`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    makeOrgAdmin: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/org/users/${userId}/make-org-admin`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    removeOrgAdmin: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/org/users/${userId}/remove-org-admin`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    allocateCredits: async (data: { departmentId: string, amount: number }) => {
      const response = await fetch(`${BASE_URL}/org/credits/allocate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    returnCredits: async (data: { departmentId: string, amount: number }) => {
      const response = await fetch(`${BASE_URL}/org/credits/return`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    getJoinRequests: async () => {
      const response = await fetch(`${BASE_URL}/org/join-requests`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    approveJoinRequest: async (reqId: string) => {
      const response = await fetch(`${BASE_URL}/org/join-requests/${reqId}/approve`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    rejectJoinRequest: async (reqId: string) => {
      const response = await fetch(`${BASE_URL}/org/join-requests/${reqId}/reject`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getTransferRequests: async () => {
      const response = await fetch(`${BASE_URL}/org/transfer-requests`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    approveTransferRequest: async (reqId: string) => {
      const response = await fetch(`${BASE_URL}/org/transfer-requests/${reqId}/approve`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    rejectTransferRequest: async (reqId: string) => {
      const response = await fetch(`${BASE_URL}/org/transfer-requests/${reqId}/reject`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getCreditRequests: async () => {
      const response = await fetch(`${BASE_URL}/org/credit-requests`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getJoinRequestsHistory: async () => {
      const response = await fetch(`${BASE_URL}/org/join-requests/history`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getTransferRequestsHistory: async () => {
      const response = await fetch(`${BASE_URL}/org/transfer-requests/history`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getCreditRequestsHistory: async () => {
      const response = await fetch(`${BASE_URL}/org/credit-requests/history`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getPendingSentSystemRequests: async () => {
      const response = await fetch(`${BASE_URL}/org/credits/requests-to-system`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getSentSystemRequestsHistory: async () => {
      const response = await fetch(`${BASE_URL}/org/credits/requests-to-system/history`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    approveCreditRequest: async (reqId: string) => {
      const response = await fetch(`${BASE_URL}/org/credit-requests/${reqId}/approve`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    rejectCreditRequest: async (reqId: string) => {
      const response = await fetch(`${BASE_URL}/org/credit-requests/${reqId}/reject`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    requestSystemCredits: async (data: { amount: number, reason: string }) => {
      const response = await fetch(`${BASE_URL}/org/credits/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    }
  },

  admin: {
    getUsers: async () => {
      const response = await fetch(`${BASE_URL}/admin/users`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    approveUser: async (id: string) => {
      const response = await fetch(`${BASE_URL}/admin/approve/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    grantAdmin: async (id: string) => {
      const response = await fetch(`${BASE_URL}/admin/grant-admin/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    revokeAdmin: async (id: string) => {
      const response = await fetch(`${BASE_URL}/admin/revoke-admin/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    toggleStatus: async (id: string) => {
      const response = await fetch(`${BASE_URL}/admin/toggle-status/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    assignPlan: async (id: string, planData: { plan: string, validityDays: number, credits: number }) => {
      const response = await fetch(`${BASE_URL}/admin/assign-plan/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(planData),
      });
      return handleResponse(response);
    },
    adjustCredits: async (id: string, credits: number) => {
      const response = await fetch(`${BASE_URL}/admin/adjust-credits/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ credits }),
      });
      return handleResponse(response);
    },
    getDashboard: async () => {
      const response = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteUser: async (id: string) => {
      const response = await fetch(`${BASE_URL}/admin/delete-user/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  },

  agents: {
    create: async (payload: { type: string, entityId: string, usecaseId: string }) => {
      const response = await fetch(`${BASE_URL}/agents/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    chat: async (id: string, message?: string, file?: File) => {
      const token = sessionStorage.getItem('token');
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (message) formData.append('message', message);
        
        const response = await fetch(`${BASE_URL}/agents/${id}/chat`, {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: formData,
        });
        return handleResponse(response);
      } else {
        const response = await fetch(`${BASE_URL}/agents/${id}/chat`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ message }),
        });
        return handleResponse(response);
      }
    },
    regenerate: async (id: string, feedback: string) => {
      const response = await fetch(`${BASE_URL}/agents/${id}/regenerate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ feedback }),
      });
      return handleResponse(response);
    },
    rollback: async (id: string, version: number) => {
      const response = await fetch(`${BASE_URL}/agents/${id}/rollback`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ version }),
      });
      return handleResponse(response);
    },
    getHistory: async (id: string) => {
      const response = await fetch(`${BASE_URL}/agents/${id}/history`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    get: async (id: string) => {
      const response = await fetch(`${BASE_URL}/agents/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    list: async (params: { type: string, entityId: string, usecaseId?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      const response = await fetch(`${BASE_URL}/agents?${query}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getStatusBulk: async (type: string, entityId: string) => {
      const response = await fetch(`${BASE_URL}/agents/status/bulk?type=${type}&entityId=${entityId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    delete: async (id: string) => {
      const response = await fetch(`${BASE_URL}/agents/${id}/delete`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    }
  }
};
