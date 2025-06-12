from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
from transformers import BartTokenizer, BartForConditionalGeneration
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import random
import re

app = Flask(__name__)
CORS(app)

# Load summarization model
bart_tokenizer = BartTokenizer.from_pretrained('facebook/bart-large-cnn')
bart_model = BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn')

# Load question generation model
t5_model_name = 'mrm8488/t5-base-finetuned-question-generation-ap'
t5_tokenizer = AutoTokenizer.from_pretrained(t5_model_name)
t5_model = AutoModelForSeq2SeqLM.from_pretrained(t5_model_name)

def extract_text_from_pdf(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()

def summarize_text(text):
    inputs = bart_tokenizer([text], max_length=1024, return_tensors='pt', truncation=True)
    summary_ids = bart_model.generate(
        inputs['input_ids'], max_length=150, min_length=40, num_beams=4, early_stopping=True)
    return bart_tokenizer.decode(summary_ids[0], skip_special_tokens=True)

def generate_questions(text, num_questions=5):
    # Split text into meaningful chunks by sentences or bullet points
    lines = [line.strip() for line in re.split(r'\. |\n|• ', text) if line.strip() and len(line.strip()) > 10]

    questions = []
    for i in range(min(num_questions, len(lines))):
        context = lines[i]

        # Generate question using the T5 model
        input_text = f"<answer> {context} <context> {text}"
        inputs = t5_tokenizer.encode(input_text, return_tensors='pt', max_length=512, truncation=True)
        outputs = t5_model.generate(inputs, max_length=64, num_beams=4, early_stopping=True)
        question = t5_tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Prepare options
        correct_option = context if len(context) < 80 else context[:77] + '...'

        options = [correct_option]
        # Fill options with other random lines as distractors
        while len(options) < 4:
            dummy = random.choice(lines)
            dummy_short = dummy if len(dummy) < 80 else dummy[:77] + '...'
            if dummy_short != correct_option and dummy_short not in options:
                options.append(dummy_short)

        random.shuffle(options)

        questions.append({
            'id': i + 1,
            'question': question,
            'options': options,
            'answer': correct_option,
            'explanation': f"The correct answer is: {correct_option}"
        })

    return questions

@app.route('/process_pdf', methods=['POST'])
def process_pdf():
    file = request.files['pdf']
    action = request.form['action']

    text = extract_text_from_pdf(file)

    if action == "summarize":
        summary = summarize_text(text)
        return jsonify({"summary": summary})

    elif action == "quiz":
        questions = generate_questions(text)
        return jsonify({"questions": questions})

    else:
        return jsonify({"error": "Invalid action"}), 400

@app.route('/submit-answers', methods=['POST'])
def submit_answers():
    data = request.get_json()
    user_answers = data.get('answers', [])
    feedback = []
    score = 0

    for ans in user_answers:
        correct_answer = ans.get('correct_answer')
        user_choice = ans.get('answer')
        is_correct = (user_choice == correct_answer)
        if is_correct:
            score += 1

        feedback.append({
            'id': ans.get('id'),
            'is_correct': is_correct,
            'your_answer': user_choice,
            'correct': correct_answer,
            'explanation': f"The correct answer is: {correct_answer}"
        })

    return jsonify({'score': score, 'details': feedback})

if __name__ == '__main__':
    app.run(debug=True)
