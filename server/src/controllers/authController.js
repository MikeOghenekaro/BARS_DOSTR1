const authService = require("../services/authService");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    res.status(401).json({ error: error.message || "Login failed" });
  }
};

exports.register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    res.status(400).json({
      error: error.message || "Registration failed",
      details: error?.stack || "No stack trace",
    });
  }
};
