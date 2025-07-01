import re
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

qna_tokenizer = AutoTokenizer.from_pretrained("valhalla/t5-base-qg-hl")
qna_model = AutoModelForSeq2SeqLM.from_pretrained("valhalla/t5-base-qg-hl")

def clean_text(text):
    """
    Remove headings and extra whitespace.
    """
    cleaned_lines = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        # Skip lines that look like headings
        if re.match(r"^(UNIT-|TOPIC-|CHAPTER-|SECTION-)", line, re.IGNORECASE):
            continue
        if line.isupper():
            continue
        cleaned_lines.append(line)
    return " ".join(cleaned_lines)

def clean_answer(sentence, max_words=25):
    """
    Clean and truncate answer text.
    """
    if ":" in sentence:
        answer_part = sentence.split(":", 1)[-1].strip()
    else:
        answer_part = sentence.strip()

    words = answer_part.split()
    if len(words) > max_words:
        answer_part = " ".join(words[:max_words]) + "..."

    return answer_part

def generate_qna(text):
    """
    Generate Q&A pairs from text.
    """
    # Clean the text to remove headings
    cleaned_text = clean_text(text)

    # Split sentences on ., ?, !
    raw_sentences = re.split(r"[.!?]", cleaned_text)
    sentences = [s.strip() for s in raw_sentences if len(s.strip()) > 20]

    if not sentences:
        return []

    results = []
    for sentence in sentences[:5]:
        input_text = f"highlight: {sentence} context: {cleaned_text}"
        inputs = qna_tokenizer.encode(input_text, return_tensors="pt", max_length=512, truncation=True)
        outputs = qna_model.generate(inputs, max_new_tokens=64)
        question = qna_tokenizer.decode(outputs[0], skip_special_tokens=True)
        answer = clean_answer(sentence)

        results.append({
            "question": question,
            "answer": answer
        })

    return results
