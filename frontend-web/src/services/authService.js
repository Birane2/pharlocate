import API from "../api/axios";

export async function getProfile() {
  const response = await API.get("/api/auth/profile/");
  return response.data;
}

export async function loginUser(credentialsOrPhoneNumber, password) {
  const credentials =
    typeof credentialsOrPhoneNumber === "object"
      ? credentialsOrPhoneNumber
      : {
          phone_number: credentialsOrPhoneNumber,
          password,
        };

  const response = await API.post("/api/auth/login/", credentials);
  return response.data;
}

export async function registerUser(formData) {
  const response = await API.post("/api/auth/register/", formData);
  return response.data;
}

export async function resendEmailOtp(email) {
  const response = await API.post("/api/auth/resend-email-otp/", { email });
  return response.data;
}

export async function verifyEmailOtp(email, otp) {
  const response = await API.post("/api/auth/verify-email-otp/", { email, otp });
  return response.data;
}

export const verifyRegisterOtp = verifyEmailOtp;
export const resendRegisterOtp = resendEmailOtp;

export async function requestPasswordReset(email) {
  const response = await API.post("/api/auth/password-reset/request/", {
    email,
  });
  return response.data;
}

export async function verifyPasswordResetOtp(email, otp) {
  const response = await API.post("/api/auth/password-reset/verify/", {
    email,
    otp,
  });
  return response.data;
}

export async function confirmPasswordReset(
  email,
  resetToken,
  newPassword,
  confirmPassword
) {
  const response = await API.post("/api/auth/password-reset/confirm/", {
    email,
    reset_token: resetToken,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  return response.data;
}
