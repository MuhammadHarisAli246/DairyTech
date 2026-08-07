"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Edit2,
    Trash2,
    Users,
    Search,
    MapPin,
    Phone,
    Milk,
    History,
} from "lucide-react";
import {
    getCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
} from "@/src/services/customerService";
import { useToast } from "@/src/components/Toast";
import Modal from "@/src/components/Modal";

const emptyForm = {
    name: "",
    phone: "",
    address: "",
    defaultMorningQty: "0",
    defaultEveningQty: "0",
    milkRate: "",
    isActive: true,
    deliveryStatus: "active",
    notes: "",
};

const getEmptyForm = () => ({ ...emptyForm });

export default function CustomersPage() {
    const router = useRouter();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] =
        useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [form, setForm] = useState(getEmptyForm);

    const { addToast } = useToast();

    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);

            const response = await getCustomers();

            setCustomers(
                Array.isArray(response)
                    ? response
                    : response?.data || []
            );
        } catch (error) {
            console.error("Load customers error:", error);
            addToast("Failed to load customers", "error");
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const filteredCustomers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (!term) return customers;

        return customers.filter((customer) => {
            return (
                customer.name?.toLowerCase().includes(term) ||
                customer.phone?.includes(term) ||
                customer.address?.toLowerCase().includes(term) ||
                customer._id?.toLowerCase().includes(term)
            );
        });
    }, [customers, searchTerm]);

    const handleOpen = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);

            setForm({
                name: customer.name || "",
                phone: customer.phone || "",
                address: customer.address || "",
                defaultMorningQty: String(
                    customer.defaultMorningQty ?? 0
                ),
                defaultEveningQty: String(
                    customer.defaultEveningQty ?? 0
                ),
                milkRate: String(customer.milkRate ?? ""),
                isActive: customer.isActive !== false,
                deliveryStatus:
                    customer.deliveryStatus || "active",
                notes: customer.notes || "",
            });
        } else {
            setEditingCustomer(null);
            setForm(getEmptyForm());
        }

        setModalOpen(true);
    };

    const handleClose = (force = false) => {
        if (saving && !force) return;

        setModalOpen(false);
        setEditingCustomer(null);
        setForm(getEmptyForm());
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const name = form.name.trim();
        const phone = form.phone.replace(/\D/g, "");
        const address = form.address.trim();
        const notes = form.notes.trim();

        const defaultMorningQty = Number(
            form.defaultMorningQty
        );

        const defaultEveningQty = Number(
            form.defaultEveningQty
        );

        const milkRate = Number(form.milkRate);

        if (!name || !phone || form.milkRate === "") {
            addToast(
                "Name, phone and milk rate are required",
                "error"
            );
            return;
        }

        if (!/^03\d{9}$/.test(phone)) {
            addToast(
                "Phone must be 11 digits and start with 03",
                "error"
            );
            return;
        }

        if (
            !Number.isFinite(defaultMorningQty) ||
            defaultMorningQty < 0
        ) {
            addToast(
                "Morning quantity must be 0 or greater",
                "error"
            );
            return;
        }

        if (
            !Number.isFinite(defaultEveningQty) ||
            defaultEveningQty < 0
        ) {
            addToast(
                "Evening quantity must be 0 or greater",
                "error"
            );
            return;
        }

        if (!Number.isFinite(milkRate) || milkRate <= 0) {
            addToast(
                "Milk rate must be greater than 0",
                "error"
            );
            return;
        }

        const payload = {
            name,
            phone,
            address,
            defaultMorningQty,
            defaultEveningQty,
            milkRate,
            isActive: form.isActive,
            deliveryStatus: form.deliveryStatus,
            notes,
        };

        try {
            setSaving(true);

            if (editingCustomer) {
                await updateCustomer(
                    editingCustomer._id,
                    payload
                );

                addToast(
                    "Customer updated successfully",
                    "success"
                );
            } else {
                await addCustomer(payload);

                addToast(
                    "Customer added successfully",
                    "success"
                );
            }

            handleClose(true);
            await loadCustomers();
        } catch (error) {
            console.error(
                "Save customer error:",
                error.response?.data || error
            );

            const responseData = error.response?.data;

            const validationMessage =
                responseData?.errors?.[0]?.message ||
                responseData?.errors?.[0]?.msg;

            addToast(
                validationMessage ||
                responseData?.message ||
                "Failed to save customer",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleViewHistory = (customer) => {
        if (!customer?._id) {
            addToast(
                "Customer ID is missing",
                "error"
            );

            return;
        }

        router.push(
            `/dashboard/customers/${customer._id}/history`
        );
    };

    const handleDelete = async (customer) => {
        const confirmed = window.confirm(
            `Delete ${customer.name}?`
        );

        if (!confirmed) return;

        try {
            await deleteCustomer(customer._id);

            addToast(
                "Customer deleted successfully",
                "success"
            );

            await loadCustomers();
        } catch (error) {
            console.error("Delete customer error:", error);

            addToast(
                error.response?.data?.message ||
                "Failed to delete customer",
                "error"
            );
        }
    };

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div>
                        <h1>Customers</h1>
                        <p>Loading customers...</p>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="skeleton"
                            style={{
                                height: "70px",
                                borderRadius: "14px",
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Customers</h1>
                    <p>
                        Manage customer details and daily milk
                        quantities
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => handleOpen()}
                >
                    <Plus
                        size={18}
                        style={{
                            marginRight: "6px",
                            verticalAlign: "middle",
                        }}
                    />
                    Add Customer
                </button>
            </div>

            <div
                className="glass-card"
                style={{
                    padding: "18px",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        maxWidth: "460px",
                    }}
                >
                    <Search
                        size={18}
                        style={{
                            position: "absolute",
                            left: "14px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#64748b",
                        }}
                    />

                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search by name, phone, address, or ID..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                        style={{ paddingLeft: "42px" }}
                    />
                </div>
            </div>

            <div
                className="glass-card animate-fade-in"
                style={{ overflow: "hidden" }}
            >
                {filteredCustomers.length === 0 ? (
                    <div
                        className="empty-state"
                        style={{ padding: "48px" }}
                    >
                        <Users size={48} />

                        <p style={{ marginTop: "12px" }}>
                            {customers.length === 0
                                ? "No customers added yet"
                                : "No customers match your search"}
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Customer</th>
                                    <th>Address</th>
                                    <th>Morning</th>
                                    <th>Evening</th>
                                    <th>Rate</th>
                                    <th>Delivery</th>
                                    <th>Account</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredCustomers.map(
                                    (customer) => (
                                        <tr key={customer._id}>
                                            <td
                                                style={{
                                                    color: "#64748b",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                {customer.customerCode || customer._id}
                                            </td>

                                            <td>
                                                <div
                                                    style={{
                                                        fontWeight:
                                                            "700",
                                                    }}
                                                >
                                                    {customer.name}
                                                </div>

                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "5px",
                                                        color: "#94a3b8",
                                                        fontSize:
                                                            "12px",
                                                        marginTop:
                                                            "3px",
                                                    }}
                                                >
                                                    <Phone
                                                        size={12}
                                                    />
                                                    {customer.phone}
                                                </div>
                                            </td>

                                            <td>
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "5px",
                                                        color: "#94a3b8",
                                                        fontSize:
                                                            "13px",
                                                    }}
                                                >
                                                    <MapPin
                                                        size={13}
                                                    />
                                                    {customer.address ||
                                                        "—"}
                                                </div>
                                            </td>

                                            <td>
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "6px",
                                                        fontWeight:
                                                            "700",
                                                    }}
                                                >
                                                    <Milk
                                                        size={14}
                                                        color="#60a5fa"
                                                    />
                                                    {Number(
                                                        customer.defaultMorningQty ||
                                                        0
                                                    ).toFixed(
                                                        1
                                                    )}{" "}
                                                    L
                                                </div>
                                            </td>

                                            <td>
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        gap: "6px",
                                                        fontWeight:
                                                            "700",
                                                    }}
                                                >
                                                    <Milk
                                                        size={14}
                                                        color="#f59e0b"
                                                    />
                                                    {Number(
                                                        customer.defaultEveningQty ||
                                                        0
                                                    ).toFixed(
                                                        1
                                                    )}{" "}
                                                    L
                                                </div>
                                            </td>

                                            <td
                                                style={{
                                                    color: "#10b981",
                                                    fontWeight: "700",
                                                }}
                                            >
                                                Rs{" "}
                                                {Number(
                                                    customer.milkRate ||
                                                    0
                                                ).toLocaleString(
                                                    "en-PK"
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        customer.deliveryStatus ===
                                                            "active"
                                                            ? "badge badge-success"
                                                            : customer.deliveryStatus ===
                                                                "paused"
                                                                ? "badge badge-warning"
                                                                : "badge badge-danger"
                                                    }
                                                    style={{
                                                        textTransform:
                                                            "capitalize",
                                                    }}
                                                >
                                                    {customer.deliveryStatus ||
                                                        "active"}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        customer.isActive !==
                                                            false
                                                            ? "badge badge-success"
                                                            : "badge badge-danger"
                                                    }
                                                >
                                                    {customer.isActive !==
                                                        false
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        alignItems: "center",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        className="btn-secondary btn-sm"
                                                        onClick={() =>
                                                            handleViewHistory(customer)
                                                        }
                                                        title={`View ${customer.name}'s milk history`}
                                                        aria-label={`View ${customer.name}'s milk history`}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        <History size={14} />

                                                        <span>History</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-secondary btn-sm"
                                                        onClick={() =>
                                                            handleOpen(customer)
                                                        }
                                                        title="Edit customer"
                                                        aria-label={`Edit ${customer.name}`}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-danger btn-sm"
                                                        onClick={() =>
                                                            handleDelete(customer)
                                                        }
                                                        title="Delete customer"
                                                        aria-label={`Delete ${customer.name}`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={handleClose}
                title={
                    editingCustomer
                        ? "Edit Customer"
                        : "Add Customer"
                }
            >
                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(2, minmax(0, 1fr))",
                            gap: "16px",
                            marginBottom: "16px",
                        }}
                    >
                        <div>
                            <label className="input-label">
                                Name
                            </label>

                            <input
                                type="text"
                                className="input-field"
                                placeholder="Customer name"
                                value={form.name}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        name: event.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div>
                            <label className="input-label">
                                Phone
                            </label>

                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={13}
                                className="input-field"
                                placeholder="03101148270"
                                value={form.phone}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        phone: event.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label className="input-label">
                            Address
                        </label>

                        <input
                            type="text"
                            className="input-field"
                            placeholder="Customer address"
                            value={form.address}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    address: event.target.value,
                                })
                            }
                        />
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(3, minmax(0, 1fr))",
                            gap: "16px",
                            marginBottom: "16px",
                        }}
                    >
                        <div>
                            <label className="input-label">
                                Morning Qty (L)
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                inputMode="decimal"
                                className="input-field"
                                value={
                                    form.defaultMorningQty
                                }
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        defaultMorningQty:
                                            event.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div>
                            <label className="input-label">
                                Evening Qty (L)
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                inputMode="decimal"
                                className="input-field"
                                value={
                                    form.defaultEveningQty
                                }
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        defaultEveningQty:
                                            event.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div>
                            <label className="input-label">
                                Rate (Rs/L)
                            </label>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                inputMode="decimal"
                                className="input-field"
                                placeholder="220"
                                value={form.milkRate}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        milkRate:
                                            event.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "1fr 1fr",
                            gap: "16px",
                            marginBottom: "16px",
                        }}
                    >
                        <div>
                            <label className="input-label">
                                Delivery Status
                            </label>

                            <select
                                className="select-field"
                                value={
                                    form.deliveryStatus
                                }
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        deliveryStatus:
                                            event.target.value,
                                    })
                                }
                            >
                                <option value="active">
                                    Active
                                </option>

                                <option value="paused">
                                    Paused
                                </option>

                                <option value="inactive">
                                    Inactive
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="input-label">
                                Account Status
                            </label>

                            <select
                                className="select-field"
                                value={
                                    form.isActive
                                        ? "active"
                                        : "inactive"
                                }
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        isActive:
                                            event.target.value ===
                                            "active",
                                    })
                                }
                            >
                                <option value="active">
                                    Active
                                </option>

                                <option value="inactive">
                                    Inactive
                                </option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label className="input-label">
                            Notes
                        </label>

                        <textarea
                            className="input-field"
                            placeholder="Optional customer notes"
                            value={form.notes}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    notes: event.target.value,
                                })
                            }
                            rows={3}
                            style={{ resize: "vertical" }}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            justifyContent: "flex-end",
                        }}
                    >
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : editingCustomer
                                    ? "Update Customer"
                                    : "Add Customer"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}