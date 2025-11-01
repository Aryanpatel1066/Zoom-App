 export const validateRoomCreate = (req, res, next) => {
  // Defensive: if req.body is missing, return explicit error
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ message: "Request body missing or not JSON. Did you set Content-Type: application/json?" });
  }

  const title = req.body.title; // safe now

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ message: "Enter title" });
  }

  // optionally trim and attach cleaned value
  req.body.title = title.trim();

  next();
};
