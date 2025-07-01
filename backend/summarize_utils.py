# summarize_utils.py
from transformers import BartTokenizer, BartForConditionalGeneration

bart_tokenizer = BartTokenizer.from_pretrained("facebook/bart-large-cnn")
bart_model = BartForConditionalGeneration.from_pretrained("facebook/bart-large-cnn")

def summarize_text(text, level="summary"):
    """
    Summarize text at different levels.
    Levels:
        - abstract (shortest)
        - summary (medium)
    """
    length_map = {
        "abstract": {"max": 30, "min": 15},
        "summary": {"max": 200, "min": 100},
    }
    lengths = length_map.get(level, {"max": 200, "min": 100})

    # If text is small, duplicate to encourage a longer summary
    if len(text.split()) < 200:
        text = text + " " + text

    # Split into chunks (if very long)
    chunks = [text[i:i+1024] for i in range(0, len(text), 1024)]
    summaries = []

    for chunk in chunks:
        inputs = bart_tokenizer([chunk], max_length=1024, return_tensors='pt', truncation=True)
        summary_ids = bart_model.generate(
            inputs['input_ids'],
            max_length=lengths["max"],
            min_length=lengths["min"],
            num_beams=2,
            early_stopping=True
        )
        chunk_summary = bart_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        summaries.append(chunk_summary)

    return "\n".join(summaries)
