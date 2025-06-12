# pdf-analyzer
 An AI-powered app to upload PDFs and instantly get a summary or auto-generated quiz with scoring and feedback.
 ## 🚀 Features

- 📄 **PDF Upload** – Upload any educational or content-rich PDF.
- 🧠 **Summarization** – Get a clean and concise summary using BART (Transformers).
- ❓ **Quiz Generation** – Auto-generate quiz questions using T5 and test your knowledge.
- ✅ **Score Evaluation** – Submit your answers and get instant feedback with explanations.
- 🎨 **Modern UI** – Built using React with Material UI for a beautiful user experience.

## 📦 Setup Instructions

### ⚙️ Backend (Flask + Transformers)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/pdf-quiz-generator.git
cd pdf-quiz-generator/backend

# 2. Create virtual environment and activate
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# 3. Install requirements
pip install -r requirements.txt

# 4. Run the Flask server
python app.py
