from flask import Flask, request, jsonify
from flask_cors import CORS
from pdf_utils import extract_text_from_pdf
from summarize_utils import summarize_text
from qna_utils import generate_qna
from quiz_utils import GroqQuizGenerator
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Load Groq API Key from .env
groq_api_key = os.getenv("GROQ_API_KEY")

# Initialize Groq Quiz Generator
quiz_generator = GroqQuizGenerator(groq_api_key)

@app.route("/")
def home():
    return "✅ Backend server is running."

@app.route("/process_pdf", methods=["POST"])
def process_pdf():
    file = request.files.get("pdf")
    if not file:
        return jsonify({"error": "No PDF file provided"}), 400

    action = request.form.get("action")
    if not action:
        return jsonify({"error": "No action provided"}), 400

    level = request.form.get("summary_level", "summary")
    num_questions = request.form.get("num_questions", "10")

    try:
        num_questions = int(num_questions)
        if num_questions < 1 or num_questions > 20:
            return jsonify({"error": "num_questions must be between 1 and 20."}), 400
    except ValueError:
        return jsonify({"error": "num_questions must be an integer."}), 400

    text = extract_text_from_pdf(file)
    if not text.strip():
        return jsonify({"error": "No text extracted from PDF."}), 400

    if action == "summarize":
        summary = summarize_text(text, level)
        return jsonify({"summary": summary})

    elif action == "quiz":
        result = quiz_generator.generate_quiz(text, num_questions)
        return jsonify(result)

    elif action == "qna":
        qna_list = generate_qna(text)
        return jsonify({"qna": qna_list})

    else:
        return jsonify({"error": "Invalid action specified."}), 400

@app.route("/submit-answers", methods=["POST"])
def submit_answers():
    data = request.get_json()
    user_answers = data.get("answers", [])
    feedback = []
    score = 0

    for ans in user_answers:
        correct_answer = ans.get("correct_answer")
        user_choice = ans.get("answer")
        is_correct = (user_choice == correct_answer)
        if is_correct:
            score += 1

        feedback.append({
            "id": ans.get("id"),
            "is_correct": is_correct,
            "your_answer": user_choice,
            "correct": correct_answer,
            "explanation": ans.get("explanation")
        })

    return jsonify({"score": score, "details": feedback})

if __name__ == "__main__":
    app.run(debug=True)
