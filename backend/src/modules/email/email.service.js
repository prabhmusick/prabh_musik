/**
 * Email Service Interface (SMTP-decoupled stubs for Sprint 5)
 */

const sendPurchaseConfirmation = async (order) => {
  // TODO: Implement transaction email templates delivery in Sprint 6
  console.log(`[EmailService] Pending purchase confirmation dispatch for Order #${order.id}`);
  return true;
};

const sendDownloadLink = async (ownership, downloadUrl) => {
  // TODO: Implement transaction download link emails delivery in Sprint 6
  console.log(`[EmailService] Pending download link dispatch for Ownership #${ownership.id}`);
  return true;
};

module.exports = {
  sendPurchaseConfirmation,
  sendDownloadLink
};
