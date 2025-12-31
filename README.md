# 🩺 MedScribe Agent — Intelligent Medical Report Analyzer

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20FastAPI%20%2B%20LangGraph-blue)

**MedScribe** is a secure, agentic AI platform designed to interpret, summarize, and explain complex medical reports.  
It uses a **16-agent architecture** orchestrated by **LangGraph**, powered by **Google Gemini 2.5 Flash**, **Qdrant Vector DB**, and **Azure Blob Storage**.

The system delivers **plain-language medical explanations**, **bilingual output (English & Sinhala)**, and a **RAG-powered chatbot** grounded strictly in the user’s own medical reports.

> ⚠️ **Disclaimer**  
> This system is for educational and assistive purposes only.  
> It does **NOT** provide medical diagnoses, prescriptions, or treatment decisions.

---

## 🏗️ High-Level Architecture

MedScribe follows a **secure 5-tier architecture**.  
The frontend never communicates directly with LLMs — all AI access is routed through a protected middleware layer.

```mermaid
flowchart TD
    subgraph Client["Client Layer (Frontend)"]
        UI[React + Vite UI]
        Upload[Medical Report Upload]
        Chat[Chat Interface]
    end

    subgraph Middleware["Middleware Layer (Security Gateway)"]
        API[Node.js / Express API]
        Auth[JWT Authentication]
        Rate[Rate Limiting & Plan Control]
    end

    subgraph AI_Logic["AI Service Layer (FastAPI)"]
        Orch[LangGraph Orchestrator]
        subgraph Agents["16 Specialized Agents"]
            Summarizer
            Classifier
            Explainer
            Translator
            Safety_Guard
        end
    end

    subgraph Data["Data & Knowledge Layer"]
        Mongo[(MongoDB - Users & Metadata)]
        Azure[(Azure Blob Storage - Reports)]
        Qdrant[(Qdrant Vector DB)]
        LLM[Google Gemini 2.5 Flash]
    end

    UI -->|Secure Request| API
    API -->|Auth & Routing| Orch
    Orch -->|Agent Workflow| Agents
    Agents -->|Reasoning| LLM
    Agents -->|Context Retrieval| Qdrant
    Agents -->|Store Metadata| Mongo
```

---

## 🚀 Key Features

- **16-Agent LangGraph Orchestration**
- **Bilingual Medical Explanation (English / Sinhala)**
- **RAG-based “Talk to Your Reports” Chatbot**
- **AES-256 Encryption & PII Redaction**
- **Emergency Safety Guardrails**

---

## 🤖 The 16-Agent System

### 🧾 Report Processing Chain (7 Agents)
1. Validator  
2. Classifier  
3. Summarizer  
4. Explainer  
5. Advisor  
6. Tone Checker  
7. Translator  

### 💬 Chatbot RAG Chain (9 Agents)
8. Safety Guard  
9. Intent Classifier  
10. Retriever  
11. Reasoning  
12. Chat Translator  
13. Chat Advice  
14. Chat Summarizer  
15. Faithfulness Checker  
16. General Health  

---

## 🛠️ Technology Stack

| Domain | Technologies |
|------|-------------|
| Frontend | React, Vite, Tailwind, ShadCN |
| Backend | Node.js, Express, JWT |
| AI | FastAPI, LangChain, LangGraph |
| LLM | Google Gemini 2.5 Flash |
| Vector DB | Qdrant |
| Storage | MongoDB, Azure Blob |
| Security | AES-256, PII Redaction |

---

## ⚡ Setup & Installation

```bash
git clone https://github.com/kavindugit/medscribe-Agent.git
cd medscribe-Agent
docker-compose up --build
```

---

## 📄 License

MIT License
