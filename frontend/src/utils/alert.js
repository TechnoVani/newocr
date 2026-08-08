import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { getApiError } from "./apiError";

const swalBase = {
  heightAuto: false,
  allowOutsideClick: true,
  scrollbarPadding: false,
  backdrop: true,
  customClass: {
    container: "nib-swal-container",
    popup: "nib-swal-popup",
    confirmButton: "nib-swal-confirm",
    cancelButton: "nib-swal-cancel",
  },
  didOpen: () => {
    const container = document.querySelector(".nib-swal-container");
    if (container) {
      container.style.position = "fixed";
      container.style.inset = "0";
      container.style.zIndex = "2147483647";
      container.style.display = "grid";
      container.style.placeItems = "center";
      container.style.padding = "16px";
    }
  },
};

const toastBase = {
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  showCloseButton: false,
  timer: 2500,
  timerProgressBar: true,
  heightAuto: false,
  backdrop: false,
  scrollbarPadding: false,
  allowOutsideClick: false,
  customClass: {
    container: "nib-swal-toast-container",
    popup: "nib-swal-toast-popup",
  },
  didOpen: () => {
    const container = document.querySelector(".nib-swal-toast-container");
    const popup = document.querySelector(".nib-swal-toast-popup");
    if (container) {
      container.style.position = "fixed";
      container.style.inset = "16px 16px auto auto";
      container.style.zIndex = "2147483647";
      container.style.width = "auto";
      container.style.pointerEvents = "none";
    }
    if (popup) {
      popup.style.pointerEvents = "none";
    }
  },
};

const closeDuplicate = (key) => {
  if (!key) return;
  const currentKey = Swal.getPopup()?.dataset?.alertKey;
  if (Swal.isVisible() && currentKey === key) return true;
  if (Swal.isVisible()) Swal.close();
  return false;
};

export const notify = async ({ icon = "info", title, text, html, confirmButtonText = "OK", key, ...options }) => {
  const alertKey = key || `${icon}:${title || ""}:${text || html || ""}`;
  if (closeDuplicate(alertKey)) return { isConfirmed: false, isDuplicateAlert: true };
  return Swal.fire({
    ...swalBase,
    icon,
    title,
    text,
    html,
    confirmButtonText,
    ...options,
    didOpen: (popup) => {
      popup.dataset.alertKey = alertKey;
      swalBase.didOpen();
      options.didOpen?.(popup);
    },
  });
};

export const notifyToast = async ({ icon = "info", title, text, html, key, ...options }) => {
  const alertKey = key || `toast:${icon}:${title || ""}:${text || html || ""}`;
  if (closeDuplicate(alertKey)) return { isConfirmed: false, isDuplicateAlert: true };
  return Swal.fire({
    ...toastBase,
    icon,
    title,
    text,
    html,
    ...options,
    didOpen: (popup) => {
      popup.dataset.alertKey = alertKey;
      toastBase.didOpen();
      options.didOpen?.(popup);
    },
  });
};

export const showSuccess = (message = "Saved successfully.", options = {}) =>
  notify({ icon: "success", title: "Success", text: message, ...options });

export const showSuccessToast = (message = "Saved successfully.", options = {}) =>
  notifyToast({ icon: "success", title: "Success", text: message, ...options });

export const showError = (message = "Something went wrong. Please try again.", options = {}) =>
  notify({ icon: "error", title: "Error", text: message, ...options });

export const showErrorToast = (message = "Something went wrong. Please try again.", options = {}) =>
  notifyToast({ icon: "error", title: "Error", text: message, ...options });

export const showValidation = (message = "Please check the highlighted fields.", options = {}) =>
  notify({ icon: "warning", title: "Validation Error", text: message, ...options });

export const showDuplicate = (message = "This record already exists.", options = {}) =>
  notify({ icon: "warning", title: "Duplicate Record", text: message, ...options });

export const showAccessDenied = (message = "You do not have permission to perform this action.", options = {}) =>
  notify({ icon: "error", title: "Access Denied", text: message, ...options });

export const showNotFound = (message = "The requested record could not be found.", options = {}) =>
  notify({ icon: "info", title: "Record Not Found", text: message, ...options });

export const confirmAction = async ({
  title = "Are you sure?",
  text = "Please confirm this action.",
  confirmButtonText = "Yes",
  cancelButtonText = "Cancel",
  icon = "question",
  ...options
} = {}) => notify({
  icon,
  title,
  text,
  showCancelButton: true,
  confirmButtonText,
  cancelButtonText,
  reverseButtons: true,
  focusCancel: true,
  ...options,
});

export const showApiError = (error, fallback, options = {}) => {
  if (error && typeof error === "object") error._swalHandled = true;
  const apiError = getApiError(error, fallback);
  if (apiError.isDuplicate) return showDuplicate(apiError.message, options);
  if (apiError.isAccessDenied) return showAccessDenied(apiError.message, options);
  if (apiError.isNotFound) return showNotFound(apiError.message, options);
  if (apiError.isValidation) return showValidation(apiError.message, options);
  return showError(apiError.message, { title: apiError.title, ...options });
};

export default {
  notify,
  notifyToast,
  showSuccess,
  showSuccessToast,
  showError,
  showErrorToast,
  showValidation,
  showDuplicate,
  showAccessDenied,
  showNotFound,
  confirmAction,
  showApiError,
};
