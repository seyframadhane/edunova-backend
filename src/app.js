const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");
const path = require("path");

const app = express();

/**
 * IMPORTANT:
 * Use plain origins (no markdown).
 * Example env:
 * CORS_ORIGIN=http://localhost:5173,http://localhost:5174
 */
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

/**
 * Helmet CSP: allow your Vite app to embed PDFs from this backend.
 * frame-ancestors controls which sites can iframe YOUR backend content.
 */
app.use(
  helmet({
    frameguard: false, // disable X-Frame-Options (we rely on CSP)
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "frame-ancestors": ["'self'", ...corsOrigins],
      },
    },
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api", rateLimit({ windowMs: 60_000, max: 200 }));

/**
 * Serve uploaded files publicly (PDFs).
 * We also ensure they can be framed by your frontend (CSP + no X-Frame-Options).
 */
app.use(
  "/uploads",
  (req, res, next) => {
    // Allow embedding PDFs in iframe from your frontend(s)
    res.setHeader(
      "Content-Security-Policy",
      `frame-ancestors 'self' ${corsOrigins.join(" ")}`
    );
    res.removeHeader("X-Frame-Options");

    // Helps when loading assets across origins in dev
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    next();
  },
  express.static(path.join(process.cwd(), "uploads"))
);

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
