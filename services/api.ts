
/**
 * API Service for Avagama AI
 * Integrated with Render backend at https://avagama-backend-ckm9.onrender.com/api
 */

// const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://3.109.133.35:5000'}/api`;
const BASE_URL = "https://avagama-backend-ckm9.onrender.com/api";
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
    listShortlistedDomain: async () => {
      const response = await fetch(`${BASE_URL}/usecases-domain/list/shortlisted`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    listShortlistedCompany: async () => {
      const response = await fetch(`${BASE_URL}/usecases/list/shortlisted`, {
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
    },
    shortlistDomain: async (docId: string, usecaseId: string) => {
      const response = await fetch(`${BASE_URL}/usecases-domain/${docId}/usecase/${usecaseId}/shortlist`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    shortlistCompany: async (docId: string, usecaseId: string) => {
      const response = await fetch(`${BASE_URL}/usecases/${docId}/usecase/${usecaseId}/shortlist`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
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
    getHistoryV2: async (agentId: string) => {
      const response = await fetch(`${BASE_URL.replace('/api', '')}/api/v2/agents/${agentId}/history`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getV2: async (agentId: string) => {
      const response = await fetch(`${BASE_URL.replace('/api', '')}/api/v2/agents/${agentId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    updateV2: async (agentId: string, data: any) => {
      const response = await fetch(`${BASE_URL.replace('/api', '')}/api/v2/agents/${agentId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    deleteV2: async (agentId: string) => {
      const response = await fetch(`${BASE_URL.replace('/api', '')}/api/v2/agents/${agentId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    chatV2: async (agentId: string, message: string) => {
      const response = await fetch(`${BASE_URL.replace('/api', '')}/api/v2/agents/${agentId}/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message }),
      });
      return handleResponse(response);
    },
    regenerateV2: async (agentId: string, feedback: string) => {
      const response = await fetch(`${BASE_URL.replace('/api', '')}/api/v2/agents/${agentId}/regenerate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ feedback }),
      });
      return handleResponse(response);
    },
    createFromUsecase: async (usecaseId: string, payload: any) => {
      const response = await fetch(`${BASE_URL.replace('/api', '')}/api/v2/agents/from-usecase`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          usecaseId,
          ...payload
        }),
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
  },

  workflows: {
    // Pipelines management
    generatePipeline: async (usecase: any, options?: any) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ usecase, options }),
      });
      return handleResponse(response);
    },
    listPipelines: async (params?: string) => {
      const query = params ? `?${params}` : '';
      const response = await fetch(`${BASE_URL}/workflows/pipelines${query}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getPipeline: async (id: string) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    updatePipeline: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    executePipeline: async (id: string, inputData: any) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}/execute`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(inputData),
      });
      return handleResponse(response);
    },
    listPipelineExecutions: async (pipelineId: string, params?: string) => {
      const query = params ? `?${params}` : '';
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${pipelineId}/executions${query}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    
    // Executions management
    getExecution: async (execId: string) => {
      const response = await fetch(`${BASE_URL}/workflows/executions/${execId}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getExecutionLogs: async (execId: string) => {
      const response = await fetch(`${BASE_URL}/workflows/executions/${execId}/logs`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getExecutionEvents: async (execId: string) => {
      const response = await fetch(`${BASE_URL}/workflows/executions/${execId}/events`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    getExecutionReplay: async (execId: string) => {
      const response = await fetch(`${BASE_URL}/workflows/executions/${execId}/replay`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    approveNode: async (execId: string, nodeId: string, decision: 'approved' | 'rejected') => {
      const response = await fetch(`${BASE_URL}/workflows/executions/${execId}/approve/${nodeId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ decision }),
      });
      return handleResponse(response);
    },
    cancelExecution: async (execId: string) => {
      const response = await fetch(`${BASE_URL}/workflows/executions/${execId}/cancel`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    deleteExecution: async (execId: string) => {
      const response = await fetch(`${BASE_URL}/workflows/executions/${execId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },

    // Legacy fallback bindings to prevent code breaks
    list: async () => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    get: async (id: string) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string, withAgents = false) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}?withAgents=${withAgents}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    execute: async (id: string, inputData: any) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}/execute`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(inputData),
      });
      return handleResponse(response);
    }
  },

  approvals: {
    list: async (status: string = 'pending') => {
      const response = await fetch(`${BASE_URL}/approvals?status=${status}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    get: async (id: string) => {
      const response = await fetch(`${BASE_URL}/approvals/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    create: async (data: { execution_id: string, node_id: string, message: string }) => {
      const response = await fetch(`${BASE_URL}/approvals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    }
  },

  pipelines: {
    list: async () => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    get: async (id: string) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    create: async (data: any) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    update: async (id: string, data: any) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
    delete: async (id: string, withAgents = false) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}?withAgents=${withAgents}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
    run: async (id: string, inputData: any) => {
      const response = await fetch(`${BASE_URL}/workflows/pipelines/${id}/execute`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(inputData),
      });
      return handleResponse(response);
    }
  },

  standalone: {
    agents: {
      list: async (params?: any) => {
        const cleanParams: Record<string, string> = {};
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v != null) cleanParams[k] = String(v);
          });
        }
        const query = Object.keys(cleanParams).length > 0 
          ? `?${new URLSearchParams(cleanParams).toString()}` 
          : '';
        const response = await fetch(`${BASE_URL}/v3/standalone/agents${query}`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      create: async (data: any) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return handleResponse(response);
      },
      get: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      update: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return handleResponse(response);
      },
      patch: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return handleResponse(response);
      },
      delete: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}`, {
          method: 'DELETE',
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      publish: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/publish`, {
          method: 'POST',
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      unpublish: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/unpublish`, {
          method: 'POST',
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      deploy: async (id: string, data?: { slug: string }) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/deploy`, {
          method: 'POST',
          headers: getHeaders(),
          body: data ? JSON.stringify(data) : undefined,
        });
        return handleResponse(response);
      },
      undeploy: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/undeploy`, {
          method: 'POST',
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      getDeployment: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/deployment`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      cloneFromBlueprint: async (data: { blueprint_id: string, name?: string }) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/clone-from-blueprint`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return handleResponse(response);
      },
      getVersions: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/versions`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      generate: async (data: { description: string; model?: string }) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/generate`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return handleResponse(response);
      },
      generateAndSave: async (data: { description: string; model?: string; save_suggestions?: boolean }) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/generate-and-save`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return handleResponse(response);
      },
      testChat: async (id: string, data: { message: string, session_id?: string | null }) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/chat`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        });
        return handleResponse(response);
      },
      kb: {
        list: async (id: string, params?: any) => {
          const query = params ? `?${new URLSearchParams(params).toString()}` : '';
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/kb${query}`, {
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        uploadFile: async (id: string, file: File) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/kb/file`, {
            method: 'POST',
            headers: getHeaders(false),
            body: formData,
          });
          return handleResponse(response);
        },
        addUrl: async (id: string, data: { url: string; title: string }) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/kb/url`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
          });
          return handleResponse(response);
        },
        addText: async (id: string, data: { title: string; text: string }) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/kb/text`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
          });
          return handleResponse(response);
        },
        addQa: async (id: string, data: { title: string; pairs: Array<{ q: string; a: string }> }) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/kb/qa`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
          });
          return handleResponse(response);
        },
        getSource: async (id: string, sourceId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/kb/${sourceId}`, {
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        updateSource: async (id: string, sourceId: string, data: any) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/kb/${sourceId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
          });
          return handleResponse(response);
        },
        deleteSource: async (id: string, sourceId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/kb/${sourceId}`, {
            method: 'DELETE',
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        reprocessSource: async (id: string, sourceId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/kb/${sourceId}/reprocess`, {
            method: 'POST',
            headers: getHeaders(),
          });
          return handleResponse(response);
        }
      },
      actions: {
        list: async (id: string, params?: { enabled?: boolean }) => {
          const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/actions${query}`, {
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        create: async (id: string, data: any) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/actions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
          });
          return handleResponse(response);
        },
        get: async (id: string, actionId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/actions/${actionId}`, {
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        update: async (id: string, actionId: string, data: any) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/actions/${actionId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
          });
          return handleResponse(response);
        },
        toggle: async (id: string, actionId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/actions/${actionId}/toggle`, {
            method: 'PATCH',
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        delete: async (id: string, actionId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/actions/${actionId}`, {
            method: 'DELETE',
            headers: getHeaders(),
          });
          return handleResponse(response);
        }
      },
      tools: {
        list: async (id: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/tools`, {
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        attach: async (id: string, data: any) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/tools`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
          });
          return handleResponse(response);
        },
        get: async (id: string, toolId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/tools/${toolId}`, {
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        update: async (id: string, toolId: string, data: any) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/tools/${toolId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
          });
          return handleResponse(response);
        },
        toggle: async (id: string, toolId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/tools/${toolId}/toggle`, {
            method: 'PATCH',
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        delete: async (id: string, toolId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/tools/${toolId}`, {
            method: 'DELETE',
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        getOAuthUrl: async (id: string, toolId: string, provider: 'google' | 'microsoft') => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/tools/${toolId}/oauth/authorize?provider=${provider}`, {
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        disconnectOAuth: async (id: string, toolId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/tools/${toolId}/oauth`, {
            method: 'DELETE',
            headers: getHeaders(),
          });
          return handleResponse(response);
        }
      },
      conversations: {
        list: async (id: string, params?: any) => {
          const query = params ? `?${new URLSearchParams(params).toString()}` : '';
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/conversations${query}`, {
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        get: async (id: string, sessionId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/conversations/${sessionId}`, {
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        tag: async (id: string, sessionId: string, tags: string[]) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/conversations/${sessionId}/tag`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ tags }),
          });
          return handleResponse(response);
        },
        end: async (id: string, sessionId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/conversations/${sessionId}/end`, {
            method: 'PATCH',
            headers: getHeaders(),
          });
          return handleResponse(response);
        },
        delete: async (id: string, sessionId: string) => {
          const response = await fetch(`${BASE_URL}/v3/standalone/agents/${id}/conversations/${sessionId}`, {
            method: 'DELETE',
            headers: getHeaders(),
          });
          return handleResponse(response);
        }
      }
    },
    tools: {
      getCatalog: async () => {
        const response = await fetch(`${BASE_URL}/v3/standalone/tools/catalog`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      }
    },
    blueprints: {
      list: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/v3/standalone/blueprints${query}`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      listIndustries: async () => {
        const response = await fetch(`${BASE_URL}/v3/standalone/blueprints/industries/list`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      },
      get: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v3/standalone/blueprints/${id}`, {
          headers: getHeaders(),
        });
        return handleResponse(response);
      }
    }
  },
  playground: {
    catalog: {
      getNodeTypes: async () => {
        const response = await fetch(`${BASE_URL}/playground/catalog/node-types`, { headers: getHeaders() });
        return handleResponse(response);
      },
      getConnectors: async () => {
        const response = await fetch(`${BASE_URL}/playground/catalog/connectors`, { headers: getHeaders() });
        return handleResponse(response);
      },
      getAgents: async () => {
        const response = await fetch(`${BASE_URL}/playground/catalog/agents`, { headers: getHeaders() });
        return handleResponse(response);
      }
    },
    flows: {
      list: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/playground/flows${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      get: async (id: string) => {
        const response = await fetch(`${BASE_URL}/playground/flows/${id}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      create: async (data: any) => {
        const response = await fetch(`${BASE_URL}/playground/flows`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      update: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/playground/flows/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      delete: async (id: string) => {
        const response = await fetch(`${BASE_URL}/playground/flows/${id}`, { method: 'DELETE', headers: getHeaders() });
        return handleResponse(response);
      },
      validate: async (id: string, data?: any) => {
        const response = await fetch(`${BASE_URL}/playground/flows/${id}/validate`, {
          method: 'POST',
          headers: getHeaders(),
          body: data ? JSON.stringify(data) : undefined
        });
        return handleResponse(response);
      },
      run: async (id: string, data?: any) => {
        const response = await fetch(`${BASE_URL}/playground/flows/${id}/run`, {
          method: 'POST',
          headers: getHeaders(),
          body: data ? JSON.stringify(data) : undefined
        });
        return handleResponse(response);
      }
    },
    runs: {
      list: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/playground/runs${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      get: async (id: string) => {
        const response = await fetch(`${BASE_URL}/playground/runs/${id}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      approve: async (id: string, decision: 'approved' | 'rejected') => {
        const response = await fetch(`${BASE_URL}/playground/runs/${id}/approve`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ decision })
        });
        return handleResponse(response);
      },
      cancel: async (id: string) => {
        const response = await fetch(`${BASE_URL}/playground/runs/${id}/cancel`, {
          method: 'POST',
          headers: getHeaders()
        });
        return handleResponse(response);
      }
    },
    schedules: {
      list: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/playground/schedules${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      create: async (flowId: string, data: any) => {
        const response = await fetch(`${BASE_URL}/playground/flows/${flowId}/schedules`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      update: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/playground/schedules/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      delete: async (id: string) => {
        const response = await fetch(`${BASE_URL}/playground/schedules/${id}`, { method: 'DELETE', headers: getHeaders() });
        return handleResponse(response);
      }
    },
    solutions: {
      list: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/playground/solutions${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      get: async (id: string) => {
        const response = await fetch(`${BASE_URL}/playground/solutions/${id}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      clone: async (id: string, data?: { name?: string }) => {
        const response = await fetch(`${BASE_URL}/playground/solutions/${id}/clone`, {
          method: 'POST',
          headers: getHeaders(),
          body: data ? JSON.stringify(data) : undefined
        });
        return handleResponse(response);
      }
    }
  },
  adminConsole: {
    getMeta: async () => {
      const response = await fetch(`${BASE_URL}/v4/admin/meta`, { headers: getHeaders() });
      return handleResponse(response);
    },
    blueprints: {
      list: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/v4/admin/agent-blueprints${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      create: async (data: any) => {
        const response = await fetch(`${BASE_URL}/v4/admin/agent-blueprints`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      update: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/v4/admin/agent-blueprints/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      publish: async (id: string, isPublished: boolean) => {
        const response = await fetch(`${BASE_URL}/v4/admin/agent-blueprints/${id}/publish`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ is_published: isPublished })
        });
        return handleResponse(response);
      },
      delete: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v4/admin/agent-blueprints/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        return handleResponse(response);
      }
    },
    solutions: {
      list: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/v4/admin/solutions${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      get: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v4/admin/solutions/${id}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      create: async (data: any) => {
        const response = await fetch(`${BASE_URL}/v4/admin/solutions`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      update: async (id: string, data: any) => {
        const response = await fetch(`${BASE_URL}/v4/admin/solutions/${id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data)
        });
        return handleResponse(response);
      },
      publish: async (id: string, isPublished: boolean) => {
        const response = await fetch(`${BASE_URL}/v4/admin/solutions/${id}/publish`, {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({ is_published: isPublished })
        });
        return handleResponse(response);
      },
      delete: async (id: string) => {
        const response = await fetch(`${BASE_URL}/v4/admin/solutions/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        return handleResponse(response);
      }
    },
    audit: {
      list: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/v4/admin/audit${query}`, { headers: getHeaders() });
        return handleResponse(response);
      }
    },
    usage: {
      modules: async () => {
        const response = await fetch(`${BASE_URL}/v4/admin/usage/modules`, { headers: getHeaders() });
        return handleResponse(response);
      },
      summary: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/v4/admin/usage/summary${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      byUser: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/v4/admin/usage/by-user${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      byModule: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/v4/admin/usage/by-module${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      timeseries: async (params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/v4/admin/usage/timeseries${query}`, { headers: getHeaders() });
        return handleResponse(response);
      },
      user: async (userId: string, params?: any) => {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        const response = await fetch(`${BASE_URL}/v4/admin/usage/user/${userId}${query}`, { headers: getHeaders() });
        return handleResponse(response);
      }
    }
  },
  solutions: {
    list: async (params?: any) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(`${BASE_URL}/v4/solutions${query}`, { headers: getHeaders() });
      return handleResponse(response);
    },
    get: async (id: string) => {
      const response = await fetch(`${BASE_URL}/v4/solutions/${id}`, { headers: getHeaders() });
      return handleResponse(response);
    },
    instantiate: async (id: string, data?: { name: string }) => {
      const response = await fetch(`${BASE_URL}/v4/solutions/${id}/instantiate`, {
        method: 'POST',
        headers: getHeaders(),
        body: data ? JSON.stringify(data) : undefined
      });
      return handleResponse(response);
    }
  },
  deployedAgent: {
    info: async (slug: string, token?: string) => {
      const q = token ? `?token=${encodeURIComponent(token)}` : '';
      const response = await fetch(`${BASE_URL}/v3/standalone/deployed/${slug}/info${q}`, { headers: getHeaders() });
      return handleResponse(response);
    },
    chat: async (slug: string, body: { session_id?: string; message: string }, token?: string) => {
      const q = token ? `?token=${encodeURIComponent(token)}` : '';
      const response = await fetch(`${BASE_URL}/v3/standalone/deployed/${slug}/chat${q}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      return handleResponse(response);
    }
  },
  agentApi: {
    keys: {
      list: async (agentId: string) => {
        const response = await fetch(`${BASE_URL}/v3/agent-api/agents/${agentId}/keys`, { headers: getHeaders() });
        return handleResponse(response);
      },
      create: async (agentId: string, data: { name?: string; rate_limit_per_min?: number }) => {
        const response = await fetch(`${BASE_URL}/v3/agent-api/agents/${agentId}/keys`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data || {})
        });
        return handleResponse(response);
      },
      revoke: async (agentId: string, keyId: string) => {
        const response = await fetch(`${BASE_URL}/v3/agent-api/agents/${agentId}/keys/${keyId}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        return handleResponse(response);
      }
    }
  }
};
