import api from "./api";

export const addPayment = async (data) => {
    const response = await api.post("/payments", data);
    return response.data;
};

export const getPaymentsByCustomer = async (customerId) => {
    const response = await api.get(`/payments/customer/${customerId}`);
    return response.data;
};

export const updatePayment = async (id, data) => {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
};

export const deletePayment = async (id) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
};
