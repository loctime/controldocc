// src/utils/getDeadlineColor.js

export const getDeadlineColor = (expirationDate) => {
    if (!expirationDate) return "textSecondary";
    const diff = (new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff <= 0) return "error.main";
    if (diff <= 2) return "error.dark";
    if (diff <= 5) return "warning.main";
    if (diff <= 15) return "warning.light";
    if (diff <= 30) return "info.main";
    return "success.main";
  };
  