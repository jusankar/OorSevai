import "dotenv/config";
import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { autoSeed } from "./src/db/seed-auto.js";
import * as dbService from "./src/db/db-service.js";


export const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Initialize Gemini SDK with telemetry User-Agent
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // ------------------------------------------
  // Users APIs
  // ------------------------------------------
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await dbService.getUser(req.params.id);
      res.json(user || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await dbService.upsertUser(req.body);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ------------------------------------------
  // Equipment APIs
  // ------------------------------------------
  app.get("/api/equipment", async (req, res) => {
    try {
      const items = await dbService.getEquipmentList();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const item = await dbService.addEquipmentItem(req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/equipment/:id", async (req, res) => {
    try {
      const item = await dbService.updateEquipmentItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      const item = await dbService.deleteEquipmentItem(req.params.id);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ------------------------------------------
  // Laborers APIs
  // ------------------------------------------
  app.get("/api/laborers", async (req, res) => {
    try {
      const items = await dbService.getLaborersList();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/laborers", async (req, res) => {
    try {
      const item = await dbService.addLaborerItem(req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/laborers/:id", async (req, res) => {
    try {
      const item = await dbService.updateLaborerItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/laborers/:id", async (req, res) => {
    try {
      const item = await dbService.deleteLaborerItem(req.params.id);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ------------------------------------------
  // Bookings APIs
  // ------------------------------------------
  app.get("/api/bookings", async (req, res) => {
    try {
      const customerId = req.query.customerId as string;
      const items = await dbService.getBookingsList(customerId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const item = await dbService.addBookingItem(req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    try {
      const item = await dbService.updateBookingItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ------------------------------------------
  // Disputes APIs
  // ------------------------------------------
  app.get("/api/disputes", async (req, res) => {
    try {
      const items = await dbService.getDisputesList();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/disputes", async (req, res) => {
    try {
      const item = await dbService.addDisputeItem(req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/disputes/:id", async (req, res) => {
    try {
      const item = await dbService.updateDisputeItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ------------------------------------------
  // Notifications APIs
  // ------------------------------------------
  app.get("/api/notifications", async (req, res) => {
    try {
      const recipientId = req.query.recipientId as string;
      const items = await dbService.getNotificationsList(recipientId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const item = await dbService.addNotificationItem(req.body);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const item = await dbService.markNotificationAsRead(req.params.id);
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/notifications/clear", async (req, res) => {
    try {
      const recipientId = req.query.recipientId as string;
      const result = await dbService.clearNotifications(recipientId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Chatbot / Farming Advisory API
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const systemInstruction = `
You are the AI Assistant for the "Equipment & Labor Rental Platform" (the "Uber + Airbnb for Equipment and Labor").
The platform serves farmers, contractors, and event organizers to rent equipment or hire laborers.
Categories:
1. Agricultural Equipment (Tractor, Rotavator, Power tiller, Paddy transplanter, Harvester, Seed drill, Sprayer, Water pump, Drone spraying, Excavator, Mini tractor)
2. Construction Equipment (Concrete mixer, Vibrator, Earth rammer, Cutting machine, Scaffolding, Generator, Welding machine, Compressor, Excavator, Road roller)
3. General Tools (Drill machine, Pressure washer, Chainsaw, Lawn mower, Ladder, Tile cutter, Power saw, Grinder)
4. Function & Event Materials (Chairs, Tables, Shamiana/Tent, Stage, Lighting, Sound system, Projector, LED wall, Decorations, Portable toilets)
5. Labor Categories (Farm labor, Mason, Carpenter, Electrician, Plumber, Painter, Welder, Driver, Crane operator, Event helpers, House shifting labor)

Your capabilities:
1. Provide accurate rental price predictions (estimating standard daily/hourly rates).
2. Give weather-based farming and construction advice.
3. Recommend specific equipment or tools for farm sizes (e.g., small farms under 2 acres need mini tractors, large ones need 50+ HP tractors) or building tasks.
4. Answer operational questions and troubleshooting on common machinery.

Keep answers professional, helpful, very concise, and highly encouraging. Use Indian terminology or local agricultural context (like Coimbatore, Tamil Nadu, Punjab, cropping seasons, Rabi, Kharif, etc.) to feel genuine and relevant. Keep answers within 3 paragraphs.
`;

      let response;
      if (history && history.length > 0) {
        // Reconstruct contents format for generateContent
        const contents = history.map((h: any) => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        }));
        contents.push({ role: 'user', parts: [{ text: message }] });

        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
          config: { systemInstruction }
        });
      } else {
        const chat = ai.chats.create({
          model: "gemini-3.5-flash",
          config: { systemInstruction }
        });
        response = await chat.sendMessage({ message });
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Chat error:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with Gemini" });
    }
  });

  // AI Rental Price Prediction API
  app.post("/api/predict-price", async (req, res) => {
    try {
      const { equipmentType, brand, year, condition, location } = req.body;

      if (!equipmentType) {
        return res.status(400).json({ error: "equipmentType is required" });
      }

      const prompt = `
Predict the optimal daily rental price in INR (₹) for:
- Equipment Type: ${equipmentType}
- Brand: ${brand || "Standard quality"}
- Year of Manufacture: ${year || "2022"}
- Current Condition: ${condition || "Good"}
- Location: ${location || "Coimbatore, Tamil Nadu"}

Analyze the market demand in India, potential maintenance costs, and seasonal fluctuations.
Provide the response in the requested structured JSON.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert appraiser of heavy agricultural, construction machinery and event materials rental pricing in India.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictedPrice: { 
                type: Type.INTEGER, 
                description: "Predicted optimal daily rental price in Indian Rupees (₹), e.g., 1800" 
              },
              priceRange: { 
                type: Type.STRING, 
                description: "Suggested range, e.g., '₹1,500 - ₹2,100 per day'" 
              },
              marketDemand: { 
                type: Type.STRING, 
                description: "Market demand rating: 'High', 'Moderate', or 'Low'" 
              },
              reasoning: { 
                type: Type.STRING, 
                description: "Detailed 2-3 sentence explanation of the predicted price based on age, brand, depreciation, and local demand." 
              },
              seasonalTips: { 
                type: Type.STRING, 
                description: "1-2 lines of advice on when price can be raised or how to increase utilization." 
              }
            },
            required: ["predictedPrice", "priceRange", "marketDemand", "reasoning", "seasonalTips"]
          }
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json(parsedData);
    } catch (error: any) {
      console.error("Gemini API Price Prediction error:", error);
      res.status(500).json({ error: error.message || "Failed to generate price prediction" });
    }
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global error handler:", err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

async function startServer() {
  const PORT = process.env.PORT || 3000;
  
  // Database auto-seeding is disabled per user request
  try {
    console.log("Database auto-seeding is disabled. Database will remain clean and empty.");
    await autoSeed();
  } catch (seedErr) {
    console.error("Database initialization check failed:", seedErr);
  }

  // Setup Vite development middleware OR static production build serving
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server successfully running on port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Critical server failure:", err);
  });
}
