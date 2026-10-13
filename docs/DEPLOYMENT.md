# ResearchMind Deployment & Local Development Guide

**Official Project Title:**  
*ResearchMind: An AI-Powered Multi-Agent Research Assistant for Literature Review and Research Gap Identification*

---

## 1. Architecture & Deployment Strategy

ResearchMind uses a modern, container-free, cloud-native deployment model:
- **Frontend:** React + Vite SPA deployed on **Vercel**
- **Backend:** Node.js + Express multi-agent pipeline deployed on **Render** (native Node runtime)
- **Primary Database:** **MongoDB Atlas** (cloud database with optional Vector Search)
- **Knowledge Graph Storage:** Dual-mode architecture supported by `graphRepository.js`:
  - **Managed Neo4j Aura (Optional):** Free-tier cloud instance (`neo4j+s://...`) for dedicated Cypher queries and native graph visualizations.
  - **MongoDB Native Graph Repository (Default):** Directly stores graph nodes and temporal edges with full $graphLookup and in-memory multi-hop traversal without needing external graph databases.
- **Machine Learning Module:** Python 3.10+ / PyTorch Geometric link prediction and evaluation module running locally in a standard virtual environment (`venv`).

---

## 2. Local Development Setup

### Prerequisites
- **Node.js**: >= 18 (Tested on Node v20 & v24)
- **Python**: >= 3.10 (Tested on Python 3.12)
- **MongoDB**: Local MongoDB Community Edition or free MongoDB Atlas cloud cluster
- **Git**: For source control

---

### Step 1: Clone Repository & Setup Environment

```bash
git clone https://github.com/<your-username>/Research-Paper_Gap-Analyzer-main.git
cd Research-Paper_Gap-Analyzer-main
```

Create local environment configuration files from templates:

```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

#### Configure Environment Variables

1. **`server/.env`**:
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_ORIGIN=http://localhost:5173
   
   # MongoDB (Local instance or MongoDB Atlas connection string)
   MONGODB_URI=mongodb://localhost:27017/researchmind
   
   # Google Gemini API Key (Required — free tier at https://aistudio.google.com/apikey)
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-flash-lite-latest
   
   # Semantic Scholar API Key (Optional — raises public rate limits)
   SEMANTIC_SCHOLAR_API_KEY=
   
   # Neo4j AuraDB (Optional — if omitted, automatically uses MongoDB graph repository)
   # NEO4J_URI=neo4j+s://<dbid>.databases.neo4j.io
   # NEO4J_USER=neo4j
   # NEO4J_PASSWORD=your_password
   ```

2. **`client/.env`**:
   ```env
   # During local dev, Vite automatically proxies /api to http://localhost:5000
   VITE_API_PROXY_TARGET=http://localhost:5000
   ```

---

### Step 2: Install Dependencies

#### Backend Dependencies:
```bash
cd server
npm install
cd ..
```

#### Frontend Dependencies:
```bash
cd client
npm install
cd ..
```

#### Python Machine Learning Dependencies (Optional / for ML Experiments):
```bash
# Create and activate a standard Python virtual environment
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# Install PyTorch and ML dependencies
pip install -r ml_service/requirements.txt
```

---

### Step 3: Run Automated Tests & Validations

Run the complete test suite in `server/` to verify agent coordination, link prediction, Graph-RAG sanitization, and temporal leakage protection:

```bash
cd server
npm test
```

Expected output:
```
✓ 19 tests passing (19/19 passing across 6 test suites)
```

Run the historical backtesting evaluation reproduction script:

```bash
cd server
npm run evaluate
```

Train and evaluate the genuine PyTorch R-GCN link prediction model:

```bash
python ml_service/train_and_evaluate.py
```

---

### Step 4: Run the Application Locally

Open two terminal windows:

#### Terminal 1 — Start Backend Server:
```bash
cd server
npm run dev
```
Backend will start on `http://localhost:5000`.

#### Terminal 2 — Start Frontend Client:
```bash
cd client
npm run dev
```
Frontend will start on `http://localhost:5173` with instant Vite hot-module reloading.

---

## 3. Production Cloud Deployment

### 1. Database Setup: MongoDB Atlas
1. Create a free shared cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and allow your server IP (or `0.0.0.0/0` for cloud PaaS).
3. Copy the standard connection string: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/researchmind?retryWrites=true&w=majority`.

### 2. Backend Deployment: Render (Web Service)
1. Push your repository to GitHub.
2. In Render Dashboard, click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Root Directory:** `server`
   - **Environment / Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Configure Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `GEMINI_API_KEY`: `<Your Gemini API key>`
   - `CLIENT_ORIGIN`: `https://your-frontend.vercel.app`
   - `NEO4J_URI`: *(Optional)* `<Your Neo4j Aura URI>`
   - `NEO4J_USER`: *(Optional)* `<Your Neo4j username>`
   - `NEO4J_PASSWORD`: *(Optional)* `<Your Neo4j password>`

### 3. Frontend Deployment: Vercel
1. In Vercel Dashboard, click **Add New...** -> **Project**.
2. Select your GitHub repository.
3. Configure build settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-render-backend-name>.onrender.com/api`
5. Click **Deploy**. Vercel will build the React SPA and serve it globally over edge CDN.

---

## 4. Git Hygiene & Secret Management

- Never commit `.env` or configuration files containing private API keys or database passwords.
- Verify `.gitignore` is active before committing:
  ```bash
  git status
  ```
- All temporary artifacts (`venv/`, `node_modules/`, `dist/`, `*.log`, `__pycache__/`) are strictly ignored.
