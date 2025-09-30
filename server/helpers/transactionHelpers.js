// Helper function to generate Transaction ID
const generateTransactionId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `T-${randomNum}`;
};

// Helper function to generate Reference Number
const generateReferenceNumber = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `REF-${randomNum}`;
};

module.exports = {
  generateTransactionId,
  generateReferenceNumber
};
