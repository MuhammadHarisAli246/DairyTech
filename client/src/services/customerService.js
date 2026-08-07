import api from "./api";

export const getCustomers = async () => {
    const response = await api.get("/customers");
    return response.data;
};

export const getCustomerById = async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
};

export const addCustomer = async (data) => {
    const response = await api.post("/customers", data);
    return response.data;
};

export const updateCustomer = async (id, data) => {
    const response = await api.put(
        `/customers/${id}`,
        data
    );

    return response.data;
};

export const deleteCustomer = async (id) => {
    const response = await api.delete(
        `/customers/${id}`
    );

    return response.data;
};

export const searchCustomerByName = async (name) => {
    const response = await api.get(
        `/search-customer/search`,
        {
            params: {
                name,
            },
        }
    );

    return response.data;
};

export const getCustomerMilkHistory = async (
    customerId,
    filters = {}
) => {
    const response = await api.get(
        `/milk/customer/${customerId}`,
        {
            params: {
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                status: filters.status || undefined,
            },
        }
    );

    return response.data;
};