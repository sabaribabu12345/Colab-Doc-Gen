import sys
import nbformat
import json

import json
import sys

def extract_code_and_markdown(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            notebook = json.load(f)

        code_cells = []
        markdown_cells = []

        for cell in notebook['cells']:
            # Extracting Code Cells
            if cell['cell_type'] == 'code':
                code_content = ''.join(cell['source'])
                if code_content.strip():  # Avoid empty code cells
                    code_cells.append(code_content)
            
            # Extracting Markdown Cells
            elif cell['cell_type'] == 'markdown':
                markdown_content = ''.join(cell['source'])
                if markdown_content.strip():  # Avoid empty markdown cells
                    markdown_cells.append(markdown_content)

        result = {
            'code': code_cells,
            'markdown': markdown_cells
        }

        print(json.dumps(result))
    except Exception as e:
        print(f"Error processing notebook: {str(e)}")

if __name__ == "__main__":
    notebook_path = sys.argv[1]
    extract_code_and_markdown(notebook_path)

