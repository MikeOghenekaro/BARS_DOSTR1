const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

let prisma;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.error("[PRISMA INIT ERROR]", e);
}

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

exports.login = async (email, password) => {
  if (!prisma) throw new Error("Prisma client not initialized");
  const systemAdmin = await prisma.systemAdmin.findUnique({ where: { email } });

  if (!systemAdmin) throw new Error("systemAdmin not found");

  const valid = await bcrypt.compare(password, systemAdmin.password);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { systemAdminId: systemAdmin.id, role: systemAdmin.role },
    JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  return { token, systemAdmin };
};

exports.register = async (data) => {
  if (!prisma) throw new Error("Prisma client not initialized");
  if (!data?.email || !data?.password) {
    console.log("Looking for admin with email:", email);
    throw new Error("Missing required fields");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const systemAdmin = await prisma.systemAdmin.create({
    data: {
      email: data.email,
      password: hashedPassword,
      username: data.username || "",
      role: data.role, // Admin, SuperAdmin, SuperDuperAdmin, FinalBossAdmin, THANOS
    },
  });

  return systemAdmin;
};
