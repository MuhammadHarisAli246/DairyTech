"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    CircleX,
    Download,
    Filter,
    History,
    Milk,
    Phone,
    Printer,
    RefreshCw,
    Search,
    User,
    Wallet,
} from "lucide-react";

import {
    getCustomers,
    getCustomerMilkHistory,
} from "@/src/services/customerService";

import { useToast } from "@/src/components/Toast";
import { getLocalDateString, getFirstDayOfMonth } from "@/src/utils/date";

const getStatusLabel = (status) => {
    if (
        status === "auto_delivered" ||
        status === "delivered"
    ) {
        return "Delivered";
    }

    if (status === "not_delivered") {
        return "Not Delivered";
    }

    if (status === "pending") {
        return "Pending";
    }

    return "No Record";
};

const isDelivered = (status) => {
    return (
        status === "auto_delivered" ||
        status === "delivered"
    );
};

const formatQuantity = (value) => {
    return `${Number(value || 0).toFixed(1)} L`;
};

const formatCurrency = (value) => {
    return `Rs ${Number(value || 0).toLocaleString(
        "en-PK"
    )}`;
};

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const normalizeHistoryResponse = (response) => {
    if (Array.isArray(response)) {
        return {
            customer: null,
            records: response,
        };
    }

    if (Array.isArray(response?.records)) {
        return {
            customer: response.customer || null,
            records: response.records,
        };
    }

    if (Array.isArray(response?.data)) {
        return {
            customer:
                response.customer ||
                response.data?.customer ||
                null,
            records: response.data,
        };
    }

    if (Array.isArray(response?.data?.records)) {
        return {
            customer:
                response.data.customer ||
                response.customer ||
                null,
            records: response.data.records,
        };
    }

    return {
        customer:
            response?.customer ||
            response?.data?.customer ||
            null,
        records: [],
    };
};

export default function CustomerHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const { addToast } = useToast();

    const customerId = String(
        params?.customerId || ""
    );

    const [customer, setCustomer] = useState(null);
    const [records, setRecords] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const [startDate, setStartDate] = useState(
        getFirstDayOfMonth()
    );

    const [endDate, setEndDate] = useState(
        getLocalDateString()
    );

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [searchTerm, setSearchTerm] =
        useState("");

    const loadHistory = useCallback(
        async ({ silent = false } = {}) => {
            if (!customerId) return;

            try {
                if (silent) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                const historyResponse =
                    await getCustomerMilkHistory(
                        customerId,
                        {
                            startDate,
                            endDate,
                        }
                    );

                const normalized =
                    normalizeHistoryResponse(
                        historyResponse
                    );

                setRecords(normalized.records);

                if (normalized.customer) {
                    setCustomer(
                        normalized.customer
                    );
                } else {
                    const customersResponse =
                        await getCustomers();

                    const customerList =
                        Array.isArray(
                            customersResponse
                        )
                            ? customersResponse
                            : customersResponse?.data ||
                              [];

                    const matchedCustomer =
                        customerList.find(
                            (item) =>
                                item._id ===
                                customerId
                        );

                    setCustomer(
                        matchedCustomer || null
                    );
                }
            } catch (error) {
                console.error(
                    "Load customer history error:",
                    error
                );

                setRecords([]);

                addToast(
                    error.response?.data?.message ||
                        "Failed to load customer milk history",
                    "error"
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [
            customerId,
            startDate,
            endDate,
            addToast,
        ]
    );

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const filteredRecords = useMemo(() => {
        const term = searchTerm
            .trim()
            .toLowerCase();

        return records.filter((record) => {
            const morningStatus =
                record.morning?.status;

            const eveningStatus =
                record.evening?.status;

            let matchesStatus = true;

            if (statusFilter === "delivered") {
                matchesStatus =
                    isDelivered(morningStatus) ||
                    isDelivered(eveningStatus);
            }

            if (
                statusFilter === "not_delivered"
            ) {
                matchesStatus =
                    morningStatus ===
                        "not_delivered" ||
                    eveningStatus ===
                        "not_delivered";
            }

            if (statusFilter === "pending") {
                matchesStatus =
                    morningStatus === "pending" ||
                    eveningStatus === "pending";
            }

            if (!matchesStatus) {
                return false;
            }

            if (!term) {
                return true;
            }

            const searchableText = [
                formatDate(record.date),
                getStatusLabel(morningStatus),
                getStatusLabel(eveningStatus),
                record.totalQty,
                record.totalAmount,
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(term);
        });
    }, [
        records,
        searchTerm,
        statusFilter,
    ]);

    const summary = useMemo(() => {
        return filteredRecords.reduce(
            (total, record) => {
                const morning =
                    record.morning || {};

                const evening =
                    record.evening || {};

                const morningQty = Number(
                    morning.deliveredQty || 0
                );

                const eveningQty = Number(
                    evening.deliveredQty || 0
                );

                const morningAmount = Number(
                    morning.amount || 0
                );

                const eveningAmount = Number(
                    evening.amount || 0
                );

                total.totalDays += 1;

                total.morningQty +=
                    morningQty;

                total.eveningQty +=
                    eveningQty;

                total.totalQty += Number(
                    record.totalQty ??
                        morningQty +
                            eveningQty
                );

                total.totalAmount += Number(
                    record.totalAmount ??
                        morningAmount +
                            eveningAmount
                );

                if (morningQty > 0) {
                    total.morningDeliveries += 1;
                }

                if (eveningQty > 0) {
                    total.eveningDeliveries += 1;
                }

                if (
                    morning.status ===
                    "not_delivered"
                ) {
                    total.notDeliveredSessions +=
                        1;
                }

                if (
                    evening.status ===
                    "not_delivered"
                ) {
                    total.notDeliveredSessions +=
                        1;
                }

                return total;
            },
            {
                totalDays: 0,
                morningQty: 0,
                eveningQty: 0,
                totalQty: 0,
                totalAmount: 0,
                morningDeliveries: 0,
                eveningDeliveries: 0,
                notDeliveredSessions: 0,
            }
        );
    }, [filteredRecords]);

    const resetFilters = () => {
        setStartDate(getFirstDayOfMonth());
        setEndDate(getLocalDateString());
        setStatusFilter("all");
        setSearchTerm("");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportCsv = () => {
        if (filteredRecords.length === 0) {
            addToast(
                "There are no records to export",
                "error"
            );

            return;
        }

        const headings = [
            "Date",
            "Morning Base",
            "Morning Extra",
            "Morning Delivered",
            "Morning Status",
            "Morning Amount",
            "Evening Base",
            "Evening Extra",
            "Evening Delivered",
            "Evening Status",
            "Evening Amount",
            "Total Quantity",
            "Total Amount",
        ];

        const rows = filteredRecords.map(
            (record) => [
                formatDate(record.date),
                Number(
                    record.morning?.baseQty || 0
                ),
                Number(
                    record.morning?.extraQty || 0
                ),
                Number(
                    record.morning
                        ?.deliveredQty || 0
                ),
                getStatusLabel(
                    record.morning?.status
                ),
                Number(
                    record.morning?.amount || 0
                ),
                Number(
                    record.evening?.baseQty || 0
                ),
                Number(
                    record.evening?.extraQty || 0
                ),
                Number(
                    record.evening
                        ?.deliveredQty || 0
                ),
                getStatusLabel(
                    record.evening?.status
                ),
                Number(
                    record.evening?.amount || 0
                ),
                Number(record.totalQty || 0),
                Number(record.totalAmount || 0),
            ]
        );

        const escapeCsvValue = (value) => {
            const text = String(value ?? "");

            return `"${text.replaceAll(
                '"',
                '""'
            )}"`;
        };

        const csv = [
            headings,
            ...rows,
        ]
            .map((row) =>
                row
                    .map(escapeCsvValue)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download = `${
            customer?.name ||
            customerId
        }-milk-history.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <div>
                        <h1>
                            Customer Milk History
                        </h1>

                        <p>
                            Loading customer records...
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(210px, 1fr))",
                        gap: "16px",
                        marginBottom: "24px",
                    }}
                >
                    {[1, 2, 3, 4].map(
                        (item) => (
                            <div
                                key={item}
                                className="skeleton"
                                style={{
                                    height: "120px",
                                    borderRadius:
                                        "16px",
                                }}
                            />
                        )
                    )}
                </div>

                <div
                    className="skeleton"
                    style={{
                        height: "380px",
                        borderRadius: "16px",
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }

                    aside,
                    nav,
                    .history-no-print {
                        display: none !important;
                    }

                    main {
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .history-print-card {
                        background: white !important;
                        border: 1px solid #d1d5db !important;
                        box-shadow: none !important;
                        color: black !important;
                    }

                    .history-print-card * {
                        color: black !important;
                    }

                    .data-table {
                        width: 100% !important;
                        font-size: 11px !important;
                    }
                }
            `}</style>

            <div className="page-header">
                <div>
                    <button
                        type="button"
                        className="btn-secondary history-no-print"
                        onClick={() =>
                            router.push(
                                "/dashboard/customers"
                            )
                        }
                        style={{
                            display:
                                "inline-flex",
                            alignItems:
                                "center",
                            gap: "7px",
                            marginBottom:
                                "14px",
                        }}
                    >
                        <ArrowLeft size={16} />
                        Back to Customers
                    </button>

                    <h1>
                        Customer Milk History
                    </h1>

                    <p>
                        Date-wise proof of regular,
                        extra and missed milk
                        deliveries
                    </p>
                </div>

                <div
                    className="history-no-print"
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                            loadHistory({
                                silent: true,
                            })
                        }
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={16}
                            style={{
                                marginRight:
                                    "7px",
                                verticalAlign:
                                    "middle",
                            }}
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={
                            handleExportCsv
                        }
                    >
                        <Download
                            size={16}
                            style={{
                                marginRight:
                                    "7px",
                                verticalAlign:
                                    "middle",
                            }}
                        />

                        Export CSV
                    </button>

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handlePrint}
                    >
                        <Printer
                            size={16}
                            style={{
                                marginRight:
                                    "7px",
                                verticalAlign:
                                    "middle",
                            }}
                        />

                        Print History
                    </button>
                </div>
            </div>

            <div
                className="glass-card history-print-card"
                style={{
                    padding: "22px",
                    marginBottom: "22px",
                    display: "flex",
                    justifyContent:
                        "space-between",
                    gap: "20px",
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "15px",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            width: "54px",
                            height: "54px",
                            borderRadius: "16px",
                            background:
                                "rgba(16, 185, 129, 0.14)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                                "center",
                            color: "#10b981",
                        }}
                    >
                        <User size={27} />
                    </div>

                    <div>
                        <h2
                            style={{
                                fontSize: "22px",
                                marginBottom:
                                    "5px",
                            }}
                        >
                            {customer?.name ||
                                "Customer"}
                        </h2>

                        <div
                            style={{
                                display: "flex",
                                gap: "14px",
                                flexWrap:
                                    "wrap",
                                color: "#94a3b8",
                                fontSize:
                                    "13px",
                            }}
                        >
                            <span>
                                ID:{" "}
                                {customer
                                    ?.customerCode ||
                                    customerId}
                            </span>

                            {customer?.phone && (
                                <span
                                    style={{
                                        display:
                                            "inline-flex",
                                        gap: "5px",
                                        alignItems:
                                            "center",
                                    }}
                                >
                                    <Phone
                                        size={13}
                                    />

                                    {
                                        customer.phone
                                    }
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        textAlign: "right",
                    }}
                >
                    <p
                        style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            marginBottom: "4px",
                        }}
                    >
                        Default Daily Milk
                    </p>

                    <strong>
                        Morning{" "}
                        {formatQuantity(
                            customer?.defaultMorningQty
                        )}{" "}
                        · Evening{" "}
                        {formatQuantity(
                            customer?.defaultEveningQty
                        )}
                    </strong>

                    <p
                        style={{
                            color: "#10b981",
                            fontSize: "13px",
                            marginTop: "5px",
                        }}
                    >
                        Rate:{" "}
                        {formatCurrency(
                            customer?.milkRate
                        )}{" "}
                        per litre
                    </p>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "15px",
                    marginBottom: "22px",
                }}
            >
                <SummaryCard
                    title="History Days"
                    value={summary.totalDays}
                    icon={<CalendarDays size={22} />}
                    helper="Records in selected period"
                />

                <SummaryCard
                    title="Morning Milk"
                    value={formatQuantity(
                        summary.morningQty
                    )}
                    icon={<Milk size={22} />}
                    helper={`${summary.morningDeliveries} delivered sessions`}
                />

                <SummaryCard
                    title="Evening Milk"
                    value={formatQuantity(
                        summary.eveningQty
                    )}
                    icon={<Milk size={22} />}
                    helper={`${summary.eveningDeliveries} delivered sessions`}
                />

                <SummaryCard
                    title="Total Milk"
                    value={formatQuantity(
                        summary.totalQty
                    )}
                    icon={
                        <CheckCircle2
                            size={22}
                        />
                    }
                    helper="Billable delivered milk"
                />

                <SummaryCard
                    title="Total Amount"
                    value={formatCurrency(
                        summary.totalAmount
                    )}
                    icon={<Wallet size={22} />}
                    helper="For selected records"
                />

                <SummaryCard
                    title="Not Delivered"
                    value={
                        summary.notDeliveredSessions
                    }
                    icon={<CircleX size={22} />}
                    helper="Missed delivery sessions"
                />
            </div>

            <div
                className="glass-card history-no-print"
                style={{
                    padding: "18px",
                    marginBottom: "22px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "15px",
                    }}
                >
                    <Filter size={17} />

                    <strong>
                        History Filters
                    </strong>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(190px, 1fr))",
                        gap: "14px",
                        alignItems: "end",
                    }}
                >
                    <div>
                        <label className="input-label">
                            Start Date
                        </label>

                        <input
                            type="date"
                            className="input-field"
                            value={startDate}
                            onChange={(event) =>
                                setStartDate(
                                    event.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label className="input-label">
                            End Date
                        </label>

                        <input
                            type="date"
                            className="input-field"
                            value={endDate}
                            onChange={(event) =>
                                setEndDate(
                                    event.target
                                        .value
                                )
                            }
                        />
                    </div>

                    <div>
                        <label className="input-label">
                            Delivery Status
                        </label>

                        <select
                            className="select-field"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target
                                        .value
                                )
                            }
                        >
                            <option value="all">
                                All Records
                            </option>

                            <option value="delivered">
                                Delivered
                            </option>

                            <option value="not_delivered">
                                Not Delivered
                            </option>

                            <option value="pending">
                                Pending
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="input-label">
                            Search History
                        </label>

                        <div
                            style={{
                                position:
                                    "relative",
                            }}
                        >
                            <Search
                                size={17}
                                style={{
                                    position:
                                        "absolute",
                                    left: "13px",
                                    top: "50%",
                                    transform:
                                        "translateY(-50%)",
                                    color: "#64748b",
                                }}
                            />

                            <input
                                type="text"
                                className="input-field"
                                placeholder="Date or status..."
                                value={
                                    searchTerm
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSearchTerm(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                style={{
                                    paddingLeft:
                                        "40px",
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={resetFilters}
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            <div
                className="glass-card history-print-card"
                style={{
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "19px 22px",
                        display: "flex",
                        justifyContent:
                            "space-between",
                        gap: "14px",
                        alignItems: "center",
                        borderBottom:
                            "1px solid rgba(148, 163, 184, 0.12)",
                    }}
                >
                    <div>
                        <h3
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: "8px",
                            }}
                        >
                            <History size={19} />
                            Daily Milk Records
                        </h3>

                        <p
                            style={{
                                color: "#64748b",
                                fontSize: "12px",
                                marginTop: "4px",
                            }}
                        >
                            Showing{" "}
                            {
                                filteredRecords.length
                            }{" "}
                            record(s)
                        </p>
                    </div>

                    <div
                        style={{
                            fontSize: "13px",
                            color: "#94a3b8",
                        }}
                    >
                        {formatDate(startDate)} —{" "}
                        {formatDate(endDate)}
                    </div>
                </div>

                {filteredRecords.length === 0 ? (
                    <div
                        className="empty-state"
                        style={{
                            padding: "56px 20px",
                        }}
                    >
                        <History size={48} />

                        <p
                            style={{
                                marginTop:
                                    "12px",
                            }}
                        >
                            No milk history found
                        </p>

                        <p
                            style={{
                                color: "#64748b",
                                fontSize: "13px",
                                marginTop:
                                    "5px",
                            }}
                        >
                            Try another date range
                            or remove the status
                            filter.
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            overflowX: "auto",
                        }}
                    >
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>

                                    <th>
                                        Morning
                                    </th>

                                    <th>
                                        Morning
                                        Status
                                    </th>

                                    <th>
                                        Evening
                                    </th>

                                    <th>
                                        Evening
                                        Status
                                    </th>

                                    <th>
                                        Extra Milk
                                    </th>

                                    <th>
                                        Total
                                    </th>

                                    <th>
                                        Amount
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredRecords.map(
                                    (record) => {
                                        const morning =
                                            record.morning ||
                                            {};

                                        const evening =
                                            record.evening ||
                                            {};

                                        const totalExtra =
                                            Number(
                                                morning.extraQty ||
                                                    0
                                            ) +
                                            Number(
                                                evening.extraQty ||
                                                    0
                                            );

                                        return (
                                            <tr
                                                key={
                                                    record._id ||
                                                    record.date
                                                }
                                            >
                                                <td>
                                                    <div
                                                        style={{
                                                            fontWeight:
                                                                "700",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {formatDate(
                                                            record.date
                                                        )}
                                                    </div>
                                                </td>

                                                <td>
                                                    <SessionQuantity
                                                        session={
                                                            morning
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <StatusBadge
                                                        status={
                                                            morning.status
                                                        }
                                                        quantity={
                                                            morning.deliveredQty
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <SessionQuantity
                                                        session={
                                                            evening
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <StatusBadge
                                                        status={
                                                            evening.status
                                                        }
                                                        quantity={
                                                            evening.deliveredQty
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <span
                                                        style={{
                                                            color:
                                                                totalExtra >
                                                                0
                                                                    ? "#f59e0b"
                                                                    : "#64748b",
                                                            fontWeight:
                                                                totalExtra >
                                                                0
                                                                    ? "700"
                                                                    : "400",
                                                        }}
                                                    >
                                                        {formatQuantity(
                                                            totalExtra
                                                        )}
                                                    </span>
                                                </td>

                                                <td
                                                    style={{
                                                        fontWeight:
                                                            "800",
                                                    }}
                                                >
                                                    {formatQuantity(
                                                        record.totalQty
                                                    )}
                                                </td>

                                                <td
                                                    style={{
                                                        color:
                                                            "#10b981",
                                                        fontWeight:
                                                            "800",
                                                        whiteSpace:
                                                            "nowrap",
                                                    }}
                                                >
                                                    {formatCurrency(
                                                        record.totalAmount
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }
                                )}
                            </tbody>

                            <tfoot>
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            textAlign:
                                                "right",
                                            fontWeight:
                                                "800",
                                        }}
                                    >
                                        Selected
                                        Period Total
                                    </td>

                                    <td
                                        style={{
                                            fontWeight:
                                                "900",
                                        }}
                                    >
                                        {formatQuantity(
                                            summary.totalQty
                                        )}
                                    </td>

                                    <td
                                        style={{
                                            color:
                                                "#10b981",
                                            fontWeight:
                                                "900",
                                        }}
                                    >
                                        {formatCurrency(
                                            summary.totalAmount
                                        )}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            <div
                className="glass-card history-print-card"
                style={{
                    padding: "18px",
                    marginTop: "18px",
                    borderLeft:
                        "4px solid #f59e0b",
                }}
            >
                <strong>
                    Record explanation
                </strong>

                <p
                    style={{
                        color: "#94a3b8",
                        lineHeight: "1.7",
                        fontSize: "13px",
                        marginTop: "6px",
                    }}
                >
                    Regular daily milk is entered
                    automatically. When milk is
                    missed, returned or changed, the
                    owner updates that particular
                    morning or evening session. This
                    page shows the saved system
                    record for the selected dates.
                </p>
            </div>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    helper,
    icon,
}) {
    return (
        <div
            className="glass-card history-print-card"
            style={{
                padding: "19px",
                minHeight: "118px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    gap: "12px",
                    alignItems: "flex-start",
                }}
            >
                <div>
                    <p
                        style={{
                            color: "#94a3b8",
                            fontSize: "13px",
                            marginBottom: "7px",
                        }}
                    >
                        {title}
                    </p>

                    <h2
                        style={{
                            fontSize: "25px",
                            fontWeight: "900",
                        }}
                    >
                        {value}
                    </h2>
                </div>

                <div
                    style={{
                        color: "#10b981",
                        background:
                            "rgba(16, 185, 129, 0.12)",
                        width: "42px",
                        height: "42px",
                        borderRadius: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                            "center",
                    }}
                >
                    {icon}
                </div>
            </div>

            <p
                style={{
                    color: "#64748b",
                    fontSize: "11px",
                    marginTop: "9px",
                }}
            >
                {helper}
            </p>
        </div>
    );
}

function SessionQuantity({ session }) {
    const baseQty = Number(
        session?.baseQty || 0
    );

    const extraQty = Number(
        session?.extraQty || 0
    );

    const deliveredQty = Number(
        session?.deliveredQty || 0
    );

    return (
        <div>
            <div
                style={{
                    fontWeight: "800",
                }}
            >
                {formatQuantity(deliveredQty)}
            </div>

            {(baseQty > 0 || extraQty > 0) && (
                <div
                    style={{
                        color: "#64748b",
                        fontSize: "11px",
                        marginTop: "3px",
                        whiteSpace: "nowrap",
                    }}
                >
                    Base {baseQty.toFixed(1)}

                    {extraQty > 0
                        ? ` + Extra ${extraQty.toFixed(
                              1
                          )}`
                        : ""}
                </div>
            )}
        </div>
    );
}

function StatusBadge({
    status,
    quantity,
}) {
    const delivered =
        isDelivered(status) &&
        Number(quantity || 0) > 0;

    const notDelivered =
        status === "not_delivered";

    const pending =
        status === "pending";

    let className = "badge";

    if (delivered) {
        className += " badge-success";
    } else if (notDelivered) {
        className += " badge-danger";
    } else if (pending) {
        className += " badge-warning";
    } else {
        className += " badge-secondary";
    }

    let label = getStatusLabel(status);

    if (
        isDelivered(status) &&
        Number(quantity || 0) === 0
    ) {
        label = "No Milk";
    }

    return (
        <span
            className={className}
            style={{
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </span>
    );
}