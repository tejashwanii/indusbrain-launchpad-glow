#  IndusBrain AI

**AI-Powered Industrial Knowledge Intelligence Platform**

IndusBrain AI is an enterprise-grade platform that transforms scattered industrial documentation into an intelligent, searchable knowledge ecosystem. By combining AI-powered document intelligence, Knowledge Graphs, Semantic Search, and Retrieval-Augmented Generation (RAG), the platform enables engineers to quickly retrieve critical information, discover hidden relationships, and make informed operational decisions.

---

##  Problem Statement

Industrial organizations generate thousands of engineering documents including:

- Engineering Manuals
- Standard Operating Procedures (SOPs)
- Maintenance Logs
- Inspection Reports
- Compliance Documents

These documents are often scattered across multiple repositories, making information retrieval slow and inefficient. Engineers spend valuable time searching for information instead of solving operational problems.

IndusBrain AI addresses this challenge by centralizing industrial knowledge into a unified AI-powered platform.

---

#  Key Features

###  Universal Document Ingestion
- Upload PDFs and industrial documents
- Automatic document parsing
- Intelligent document indexing

###  AI Document Intelligence
- Text extraction
- Intelligent chunking
- Embedding generation
- Metadata extraction

###  AI Knowledge Graph
- Automatic entity extraction
- Relationship discovery
- Equipment & component mapping
- Interactive graph visualization

###  Semantic Search
- Context-aware search
- Natural language retrieval
- Vector similarity search using ChromaDB

###  AI Knowledge Copilot
- Retrieval-Augmented Generation (RAG)
- Context-aware answers
- Confidence Score (Low / Medium / High)
- Source Attribution (Document Reference)
- Automatic fallback to indexed document chunks if external AI service is unavailable

###  Compliance Center
- Compliance document discovery
- Regulatory information retrieval
- Faster compliance verification

###  Analytics Dashboard
- Document statistics
- AI usage analytics
- Knowledge insights
- Platform activity monitoring

---

#  System Architecture

```
Industrial Documents
        │
        ▼
Document Processing
(OCR • Parsing • Chunking)
        │
        ▼
Entity Extraction
        │
        ▼
Knowledge Graph
        │
        ▼
Embedding Generation
        │
        ▼
ChromaDB Vector Store
        │
        ▼
Semantic Search
        │
        ▼
AI Knowledge Copilot
        │
        ▼
Industrial Intelligence
```

---

# 🛠 Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS

### Backend
- FastAPI
- Python

### AI & Machine Learning
- LangChain
- Sentence Transformers
- ChromaDB
- Retrieval-Augmented Generation (RAG)

### Knowledge Representation
- Knowledge Graph
- Entity Extraction

### Database & Storage
- ChromaDB
- Local File Storage

---

#  Platform Modules

- Dashboard
- Document Upload
- Knowledge Hub
- AI Assistant
- Knowledge Graph
- Compliance Center
- Analytics Dashboard

---

#  Business Impact

- ⚡ Faster Knowledge Retrieval
- 🛠 Improved Operational Efficiency
- 🧠 AI-Assisted Decision Making
- 📉 Reduced Operational Costs
- 📋 Improved Compliance Management

---

#  Scalability

- Modular FastAPI Architecture
- Enterprise-Ready Design
- Extensible Knowledge Graph
- Cloud Deployment Ready
- Supports Growing Document Repositories

---

#  Future Roadmap

- Voice-enabled AI Assistant
- Multilingual Support
- Enhanced RAG Pipeline
- ERP & CMMS Integration
- IoT-enabled Monitoring
- Predictive Maintenance
- Automated Compliance Auditing
- Intelligent Decision Support

---

#  Installation

## Clone Repository

```bash
git clone https://github.com/<your-repository>.git
```

## Backend

```bash
cd backend

python -m venv .venv

source .venv/bin/activate
# Windows
.venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

## Frontend

```bash

npm install

npm run dev
```

---


# 📄 License

This project was developed as part of the **ET AI Hackathon**.
