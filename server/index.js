require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./routes/userRoutes.js");
const carRoutes = require("./routes/carRoutes.js");
const cartRoutes = require("./routes/cartRoutes.js");
const dbConnection = require("./database/db.js");
const botRoutes = require("./routes/botRoutes.js");
const paypalRoutes = require("./routes/paypalRoutes.js");

const app = express();
const PORT = process.env.PORT || 8000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Middleware
const allowedOrigins = ['http://localhost:5173', 'https://car-dealership-frontend-indol.vercel.app'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

app.use(express.static(path.resolve("public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

dbConnection(process.env.DB_URL);

// Routes
app.get("/", (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? "Connected" : "Not Connected";

  res.send(`
    <h1>Server Status</h1>
    <p>Server is running on port ${PORT} (HTTP) and ${HTTPS_PORT} (HTTPS)</p>
    <p>MongoDB Status: ${mongoStatus}</p>
    <p>MongoDB URL: ${process.env.DB_URL}</p>
  `);
});

app.use("/user", userRoutes);
app.use("/car", carRoutes);
app.use("/cart", cartRoutes);
app.use("/bot", botRoutes);
app.use('/paypal', paypalRoutes);

// Create the HTTP server
const httpServer = http.createServer(app);

// Read SSL certificate and key for HTTPS
const sslOptions = {
  key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.key')),
  cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.crt')),
};

// Create the Socket.IO server on the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log("User connected with ID -> ", socket.id);

  socket.on("set-username", (username) => {
    socket.username = username;  // Store the username on the socket object
    console.log(`Username set for ${socket.id}: ${username}`);
  });

  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    socket.userId = userId;  // Store userId on the socket object
    console.log(`User with ID ${userId} joined room ${roomId}`);
  });

  socket.on("send-message", ({ roomId, message, senderId }) => {
    io.to(roomId).emit("received-message", { 
      senderId, 
      message, 
      senderUsername: socket.username || "Anonymous"  // Include senderUsername
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

// Start the HTTP server
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP Server is running on port ${PORT}`);
});