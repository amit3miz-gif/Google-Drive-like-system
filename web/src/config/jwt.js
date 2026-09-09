const isProd = process.env.NODE_ENV === "production";

const secret = process.env.JWT_SECRET || "dev_secret_change_me";

if (isProd && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production");
}

module.exports = {
  secret,
  expiresIn: process.env.JWT_EXPIRES_IN || "1h",
};
