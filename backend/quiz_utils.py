# quiz_utils.py
import json
from groq import Groq

class GroqQuizGenerator:
    def __init__(self, groq_api_key, model="llama3-70b-8192"):
        self.client = Groq(api_key=groq_api_key)
        self.model = model

    def build_prompt(self, context, num_questions=10):
        return f"""
You are a helpful AI tutor. Create exactly {num_questions} multiple-choice questions based on the following text.

Each question must:
- Have 4 options: A, B, C, D
- Mark the correct option using "correct_answer"
- Include a short explanation for the correct answer

Text:
\"\"\"{context}\"\"\"

Respond ONLY in this JSON format:
{{
  "questions": [
    {{
      "question": "Your question here?",
      "options": {{
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      }},
      "correct_answer": "A",
      "explanation": "Because ..."
    }}
  ]
}}
Only output the JSON.
"""

    def generate_quiz(self, context, num_questions=10):
        prompt = self.build_prompt(context, num_questions)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2048,
        )

        output = response.choices[0].message.content.strip()
        start = output.find('{')
        end = output.rfind('}') + 1
        json_str = output[start:end]

        try:
            quiz_data = json.loads(json_str)
            if "questions" in quiz_data:
                return quiz_data
            else:
                return {"error": "Parsed JSON does not contain 'questions'."}
        except json.JSONDecodeError as e:
            return {"error": f"Failed to parse JSON: {e}\n\nRaw response:\n{output}"}
