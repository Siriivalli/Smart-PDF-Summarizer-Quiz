import fitz  # PyMuPDF

def extract_text_from_pdf(file, max_chars=12000):
    """
    Extracts text from a PDF using PyMuPDF. Handles file or bytes input.
    """
    # If it's bytes, use directly; else, read
    if isinstance(file, bytes):
        file_bytes = file
    else:
        file_bytes = file.read()
    
    combined_text = ""
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            if len(combined_text) > max_chars:
                break
            page_text = page.get_text("text")
            combined_text += page_text + "\n"

    return combined_text[:max_chars]
