export const buildBillMessage = (receipt) => {
    return `*Haris Dairy*

Assalam-o-Alaikum ${receipt.customer?.name || "Customer"},

Your monthly milk bill has been generated.

📅 Month:
${receipt.month}

🥛 Total Milk:
${receipt.totalMilk} Liters

💰 Total Bill:
Rs ${receipt.totalAmount}

✅ Paid:
Rs ${receipt.paidAmount}

⚠ Remaining:
Rs ${receipt.remainingBalance}

Status:
${receipt.status.replaceAll("_", " ").toUpperCase()}

Thank you for choosing Haris Dairy.

Regards,
Haris Dairy`;
};

export const sendSingleWhatsApp = (receipt) => {
    if (!receipt.customer?.phone) return;

    const phone = receipt.customer.phone.replace(/\D/g, "");

    const message = buildBillMessage(receipt);

    window.open(
        `https://wa.me/92${phone.slice(-10)}?text=${encodeURIComponent(message)}`,
        "_blank"
    );
};

export const sendAllWhatsApp = (receipts) => {
    if (!receipts.length) return;

    let delay = 0;

    receipts.forEach((receipt) => {
        setTimeout(() => {
            sendSingleWhatsApp(receipt);
        }, delay);

        delay += 1200;
    });
};