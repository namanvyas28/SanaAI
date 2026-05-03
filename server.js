const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const upload = multer({ dest: "uploads/" });

let pdfText = "";

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Upload PDF
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    pdfText = data.text;

    console.log("PDF LOADED:", pdfText.substring(0, 100));

    res.json({ message: "PDF uploaded successfully" });
  } catch (err) {
    console.log(err);
    res.json({ message: "Error reading PDF" });
  }
});

// Chat
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  let prompt = "";

  if (!pdfText || pdfText.length < 50) {
    prompt = `Answer this normally: ${userMessage}`;
  } else {
    prompt = `
    PDF:
    ${pdfText}

    Question: ${userMessage}
    `;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.log(err);
    res.json({ reply: "Error with OpenAI API" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));