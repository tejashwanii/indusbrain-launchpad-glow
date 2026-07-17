from app.services.pdf_service import (
    extract_pdf_text,
    PDFExtractionError,
)

pdf_path = "uploads/a6b39baa-54d0-44f0-adbb-8584b3297bf9.pdf" 

try:
    result = extract_pdf_text(pdf_path)

    print("=" * 60)
    print("PDF Extraction Successful")
    print("=" * 60)

    print(f"Total Pages: {result.total_pages}")

    print("\nFull Text:")
    print("-" * 60)
    print(result.full_text)

    print("\nPage-wise Output:")
    print("-" * 60)

    for page in result.pages:
        print(f"\nPage {page.page_number}")
        print(page.text)

except PDFExtractionError as e:
    print(f"Extraction failed: {e}")