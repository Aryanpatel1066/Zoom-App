 import { toast, Bounce } from "react-toastify";

const options = {
  position: "top-right",
  autoClose: 1000,
  theme: "light",
  transition: Bounce,
};

export const successToast = (msg) => toast.success(msg, options);
export const errorToast = (msg) => toast.error(msg, options);
export const warnToast = (msg) => toast.warn(msg, options);
