import apiClient from '../../../services/apiClient';

export const contactsApi = {
  list: () => apiClient.get('/api/contacts').then((r) => r.data),
  addPhone: (contactId, phone) => apiClient.post(`/api/contacts/${contactId}/phones`, { phone }).then((r) => r.data),
  updatePhoneLabel: (contactId, phone, label) =>
    apiClient.patch(`/api/contacts/${contactId}/phones`, { phone, label }).then((r) => r.data),
  listPaginated: ({ page, pageSize, q, category }) =>
    apiClient
      .get('/api/contacts-paginated', { params: { page, pageSize, q: q || undefined, category } })
      .then((r) => r.data),
  createCustomerCard: (payload) => apiClient.post('/api/contacts/customer-card', payload).then((r) => r.data),
  updateCustomerCard: (contactId, payload) =>
    apiClient.patch(`/api/contacts/${contactId}/customer-card`, payload).then((r) => r.data),
  remove: (contactId) => apiClient.delete(`/api/contacts/${contactId}`).then((r) => r.data),
};

export const devicesApi = {
  list: (contactId) => apiClient.get(`/api/contacts/${contactId}/devices`).then((r) => r.data),
  add: (contactId, device) => apiClient.post(`/api/contacts/${contactId}/devices`, device).then((r) => r.data),
  update: (contactId, deviceId, device) => apiClient.patch(`/api/contacts/${contactId}/devices/${deviceId}`, device).then((r) => r.data),
  remove: (contactId, deviceId) => apiClient.delete(`/api/contacts/${contactId}/devices/${deviceId}`).then((r) => r.data),
};
