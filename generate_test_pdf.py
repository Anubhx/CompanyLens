import fitz  # PyMuPDF

def create_sample_contract():
    # Create a new Empty PDF
    doc = fitz.open()
    
    # Add a page
    page = doc.new_page()
    
    # The text we want in our fake contract
    contract_text = """
MASTER SERVICES AGREEMENT - ACME CORP

1. PARTIES
This Master Services Agreement ("Agreement") is between Acme Corp ("Company") and the Service Provider.

2. PAYMENT TERMS
Company agrees to pay Service Provider $10,000 per month. Invoices must be paid within Net 90 days. Late payments will incur a 1% daily interest rate penalty. (Red flag: Net 90 is very long, 1% daily is illegally high).

3. INTELLECTUAL PROPERTY
All work products, code, and inventions created by the Service Provider during the term of this Agreement shall be the exclusive property of Acme Corp.

4. LIABILITY
In no event shall Acme Corp's total liability exceed the total amount paid to the Service Provider in the one (1) month preceding the event giving rise to the claim. 

5. NON-COMPETE
During the term of this Agreement and for a period of five (5) years thereafter, Service Provider shall not work for, consult with, or provide services to any competitor of Acme Corp anywhere in the universe. (Red flag: 5 years universe-wide is unenforceable).

6. TERMINATION
Acme Corp may terminate this agreement at any time without notice. Service Provider must provide 60 days written notice to terminate.
    """
    
    # Define a rectangle where text will be placed
    rect = fitz.Rect(50, 50, 550, 800)
    
    # Insert the text
    page.insert_textbox(rect, contract_text, fontsize=12, fontname="helv", align=0)
    
    # Save the PDF
    pdf_path = "/Users/anubhav/Downloads/Ai project/Acme_Corp_Contract.pdf"
    doc.save(pdf_path)
    print(f"Sample contract successfully created at: {pdf_path}")

if __name__ == "__main__":
    create_sample_contract()
