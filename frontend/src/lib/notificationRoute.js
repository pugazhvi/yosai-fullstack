export function notificationRoute(n, role) {
  if (!n) return null;
  const { type, referenceModel, referenceId } = n;

  if (referenceModel === "Inquiry") {
    if (role === "admin") return "/admin/inquiries";
    return "/orders";
  }

  if (role === "admin") {
    switch (type) {
      case "order_placed":
      case "order_confirmed":
      case "order_shipped":
      case "order_delivered":
      case "order_cancelled":
      case "order_delayed":
        return "/admin/orders";
      case "payout_processed":
        return "/admin/payouts";
      case "product_approved":
      case "product_rejected":
        return "/admin/products";
      case "kyc_update":
        return "/admin/document-review";
      case "low_stock":
        return "/admin/inventory";
      case "new_message":
        return "/admin/support";
      default:
        return null;
    }
  }

  if (role === "vendor") {
    switch (type) {
      case "order_placed":
      case "order_confirmed":
      case "order_shipped":
      case "order_delivered":
      case "order_cancelled":
      case "order_delayed":
        return "/vendor/orders";
      case "payout_processed":
      case "refund_credited":
        return "/vendor/wallet";
      case "product_approved":
      case "product_rejected":
        return "/vendor/products";
      case "low_stock":
        return "/vendor/products";
      case "kyc_update":
        return "/vendor/documents";
      case "new_message":
        return "/vendor/support";
      default:
        return null;
    }
  }

  switch (type) {
    case "order_placed":
    case "order_confirmed":
    case "order_shipped":
    case "order_delivered":
    case "order_cancelled":
    case "order_delayed":
    case "refund_credited":
      return referenceId ? `/orders/${referenceId}` : "/orders";
    case "new_message":
      return "/support";
    default:
      return null;
  }
}
