import React from "react";
import { useState } from "react";
import "./HomePage.css";

export default function HomePage() {
  const [formData, setFormData] = useState({
    rawText: "",
    platforms: [],
  });
  const [geminiResponse,setGeminiResponse]=useState("")
  const [structuredPosts, setStructuredPosts] = useState({});

  
  function parseGeminiResponse(text) {
    if (!text || typeof text !== "string") return {};

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonText = jsonMatch[0];
        const safeJson = jsonText
          .replace(/([\n\r])+/g, " ")
          .replace(/\t+/g, " ")
          .trim();
        const parsed = JSON.parse(safeJson);
        const normalized = {};
        for (const key in parsed) {
          if (!Object.prototype.hasOwnProperty.call(parsed, key)) continue;
          const v = String(parsed[key] ?? "").trim();
          const lower = key.toLowerCase();
          if (lower.includes("linkedin") || lower.includes("linkdin")) normalized["LinkedIn"] = v;
          else if (lower.includes("instagram") || lower.includes("instagrm")) normalized["Instagram"] = v;
          else if (lower.includes("twitter")) normalized["Twitter"] = v;
          else normalized[key] = v;
        }
        return normalized;
      }
    } catch (e) {
      console.warn("JSON parse failed, falling back to regex parsing", e);
    }

    const normalized = {};
    const platforms = ["LinkedIn", "Instagram", "Twitter"];
    const cleaned = text.replace(/\r/g, "");

    for (const p of platforms) {
      const re = new RegExp(p + "\\s*[:\\-]?\\s*([\\s\\S]*?)(?=(LinkedIn|Instagram|Twitter|$))", "i");
      const m = cleaned.match(re);
      if (m && m[1]) {
        let content = m[1].trim();
        content = content.replace(/^post\s*[:\-]\s*/i, "");
        content = content.replace(/^[-*\u2022]\s*/g, "");
        content = content.replace(/^\"|\"$/g, "").trim();
        if (content) normalized[p] = content;
      }
    }

    if (Object.keys(normalized).length === 0 && formData.platforms && formData.platforms.length > 0) {
      const chunks = cleaned.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
      formData.platforms.forEach((pf, idx) => {
        const key = pf === 'Linkdin' ? 'LinkedIn' : pf; 
        if (chunks[idx]) normalized[key] = chunks[idx].replace(/^post\s*[:\-]\s*/i, "").trim();
      });
    }

    return normalized;
  }
  async function contactGemini() {
    try {
      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
      const options = {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-goog-api-key": "AIzaSyAFVziVC_tO41sXf0GRVPbszShgK0FQG3U",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `I want you to generate social media posts based on the raw text: ${formData.rawText} for the following platforms: ${formData.platforms.join(", ")}.\n\nReturn ONLY valid JSON (no extra explanation) that maps platform names to the post content. Example: {"LinkedIn":"...","Instagram":"...","Twitter":"..."}.\n\nMake sure posts match the typical tone and length for each platform.`,
                },
              ],
            },
          ],
        }),
      };

      try {
        const response = await fetch(url, options);
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        setGeminiResponse(text);
        const structured = parseGeminiResponse(text);
        setStructuredPosts(structured);
        console.log("Gemini Response: ", text, "\nParsed:", structured);
      } catch (error) {
        console.error(error);
      }
    } catch {}
  }
  return (
    <>
      <h1>Social Media Posts Genrator</h1>
      <form>
        <h3>Enter Raw Text : </h3>
        <textarea
          name="rawText"
          id="rawText"
          rows={20}
          cols={200}
          onChange={(e) =>
            setFormData({ ...formData, rawText: e.target.value })
          }
          value={formData.rawText}
        ></textarea>
        <h3>Platforms</h3>
        <div className="platforms-container">
          <div className="checkbox-item">
            <input
              type="checkbox"
              name="platform"
              id="LinkedIn"
              value={"LinkedIn"}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData({
                    ...formData,
                    platforms: [...formData.platforms, e.target.value],
                  });
                } else {
                  setFormData({
                    ...formData,
                    platforms: [
                      ...formData.platforms.filter(
                        (platforms) => platforms !== e.target.value
                      ),
                    ],
                  });
                }
              }}
            />
            <label htmlFor="LinkedIn">LinkedIn</label>
          </div>
          <div className="checkbox-item">
            <input
              type="checkbox"
              name="platform"
              id="Instagram"
              value={"Instagram"}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData({
                    ...formData,
                    platforms: [...formData.platforms, e.target.value],
                  });
                } else {
                  setFormData({
                    ...formData,
                    platforms: [
                      ...formData.platforms.filter(
                        (platforms) => platforms !== e.target.value
                      ),
                    ],
                  });
                }
              }}
            />
            <label htmlFor="Instagram">Instagram</label>
          </div>
          <div className="checkbox-item">
            <input
              type="checkbox"
              name="platform"
              id="Twitter"
              value={"Twitter"}
              onChange={(e) => {
                if (e.target.checked) {
                  setFormData({
                    ...formData,
                    platforms: [...formData.platforms, e.target.value],
                  });
                } else {
                  setFormData({
                    ...formData,
                    platforms: [
                      ...formData.platforms.filter(
                        (platforms) => platforms !== e.target.value
                      ),
                    ],
                  });
                }
              }}
            />
            <label htmlFor="Twitter">Twitter</label>
          </div>
        </div>
        
        <button type="button" onClick={contactGemini}>
          Contact Gemini{" "}
        </button>
      </form>
      {Object.keys(structuredPosts).length > 0 ? (
        <div className="results-section">
          <h2>Generated Posts</h2>
          {Object.entries(structuredPosts).map(([platform, post]) => (
            <div key={platform} className="post-card">
              <h3>{platform}</h3>
              <p>{post}</p>
            </div>
          ))}
        </div>
      ) : (
        geminiResponse.length > 0 && (
          <div className="results-section">
            <h2>Raw Response</h2>
            <pre>{geminiResponse}</pre>
          </div>
        )
      )}
    </>
  );
}