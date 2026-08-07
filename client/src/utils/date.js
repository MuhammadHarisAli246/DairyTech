export function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function getFirstDayOfMonth(date = new Date()) {
    return getLocalDateString(new Date(date.getFullYear(), date.getMonth(), 1));
}
